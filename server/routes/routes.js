import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import planMiddleware from '../middleware/plan.js';
import { geocodeAddress } from '../services/geocoding.js';
import { getDistanceMatrix } from '../services/distance.js';
import { optimizeRoute, minutesToTimeStr, calculateTotalDuration } from '../services/optimizer.js';

const router = Router();

router.use(authMiddleware);
router.use(planMiddleware);

router.post('/optimize', async (req, res) => {
  const user = await req.prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  let visits = await req.prisma.visit.findMany({
    where: { userId: req.userId, status: 'draft', routeId: null },
    orderBy: { createdAt: 'asc' },
  });

  if (visits.length === 0) {
    return res.status(400).json({ error: 'Nenhuma visita para otimizar' });
  }

  const maxVisits = req.userPlan === 'paid' ? Infinity : 5;
  if (visits.length > maxVisits) {
    return res.status(403).json({
      error: `Limite de ${maxVisits} visitas atingido no plano gratuito. Faça upgrade para o plano pago.`,
      limitExceeded: true,
    });
  }

  const startTime = req.body.startTime || user.startTime || '08:00';
  const avgServiceTime = req.body.avgServiceTime || user.avgServiceTime || 30;

  let baseCoords;
  try {
    if (user.baseLat && user.baseLng) {
      baseCoords = { lat: user.baseLat, lng: user.baseLng };
    } else {
      baseCoords = await geocodeAddress(user.baseAddress, req.prisma);
      await req.prisma.user.update({
        where: { id: req.userId },
        data: { baseLat: baseCoords.lat, baseLng: baseCoords.lng },
      });
    }
  } catch (err) {
    return res.status(400).json({ error: `Erro ao geocodificar endereço base: ${err.message}` });
  }

  const visitCoords = [];
  const timeWindows = [];

  for (const visit of visits) {
    try {
      let coords;
      if (visit.lat && visit.lng) {
        coords = { lat: visit.lat, lng: visit.lng };
      } else {
        const fullAddress = `${visit.address}, ${visit.number}, ${visit.neighborhood}, ${visit.city}`;
        coords = await geocodeAddress(fullAddress, req.prisma);
        await req.prisma.visit.update({
          where: { id: visit.id },
          data: { lat: coords.lat, lng: coords.lng },
        });
      }
      visitCoords.push(coords);
      timeWindows.push(visit.timeWindow);
    } catch (err) {
      return res.status(400).json({
        error: `Erro ao geocodificar endereço de ${visit.name}: ${err.message}`,
      });
    }
  }

  const allCoords = [baseCoords, ...visitCoords];

  let distanceMatrix;
  try {
    distanceMatrix = await getDistanceMatrix(allCoords);
  } catch (err) {
    return res.status(502).json({ error: `Erro ao consultar matriz de distâncias: ${err.message}` });
  }

  const result = optimizeRoute(
    allCoords.slice(1),
    distanceMatrix,
    timeWindows,
    startTime,
    avgServiceTime
  );

  const orderedVisits = result.route.map((visitIdx, order) => {
    const visit = visits[visitIdx];
    const arrivalTimeStr = minutesToTimeStr(result.times[order]);
    return {
      order: order + 1,
      id: visit.id,
      name: visit.name,
      address: visit.address,
      number: visit.number,
      neighborhood: visit.neighborhood,
      city: visit.city,
      zipCode: visit.zipCode,
      phone: visit.phone,
      timeWindow: visit.timeWindow,
      lat: visitCoords[visitIdx].lat,
      lng: visitCoords[visitIdx].lng,
      arrivalTime: arrivalTimeStr,
    };
  });

  const totalDuration = calculateTotalDuration(distanceMatrix, result.route);
  const totalMinutes = totalDuration / 60 + visits.length * avgServiceTime;

  res.json({
    orderedVisits,
    startTime,
    avgServiceTime,
    totalDurationMinutes: Math.round(totalMinutes),
    baseCoords,
    visitCoords,
    optimizedOrder: result.route,
  });
});

router.get('/history', async (req, res) => {
  const routes = await req.prisma.route.findMany({
    where: { userId: req.userId, status: 'completed' },
    include: { visits: true },
    orderBy: { date: 'desc' },
  });
  res.json(routes);
});

router.get('/history/:id', async (req, res) => {
  const route = await req.prisma.route.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { visits: true },
  });
  if (!route) return res.status(404).json({ error: 'Rota não encontrada' });
  res.json(route);
});

router.post('/save', async (req, res) => {
  const { visitIds, optimizedOrder, totalDuration } = req.body;

  const user = await req.prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const route = await req.prisma.route.create({
    data: {
      userId: req.userId,
      status: 'completed',
      optimizedOrder: JSON.stringify(optimizedOrder),
      totalDuration: totalDuration || null,
      date: new Date(),
    },
  });

  if (visitIds && visitIds.length > 0) {
    await req.prisma.visit.updateMany({
      where: { id: { in: visitIds } },
      data: { routeId: route.id, status: 'completed' },
    });
  }

  res.json(route);
});

router.post('/copy-previous', async (req, res) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const end = new Date(yesterday);
  end.setHours(23, 59, 59, 999);

  const prevRoute = await req.prisma.route.findFirst({
    where: {
      userId: req.userId,
      status: 'completed',
      date: { gte: yesterday, lte: end },
    },
    include: { visits: true },
    orderBy: { date: 'desc' },
  });

  if (!prevRoute || prevRoute.visits.length === 0) {
    return res.status(404).json({ error: 'Nenhuma visita do dia anterior encontrada' });
  }

  const newVisits = [];
  for (const v of prevRoute.visits) {
    const visit = await req.prisma.visit.create({
      data: {
        userId: req.userId,
        name: v.name,
        address: v.address,
        number: v.number,
        neighborhood: v.neighborhood,
        city: v.city,
        zipCode: v.zipCode,
        phone: v.phone,
        timeWindow: v.timeWindow,
        status: 'draft',
      },
    });
    newVisits.push(visit);
  }

  res.json({ visits: newVisits, message: `${newVisits.length} visitas copiadas do dia anterior` });
});

export default router;
