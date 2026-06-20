import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import authMiddleware from '../middleware/auth.js';
import planMiddleware from '../middleware/plan.js';

const router = Router();

router.use(authMiddleware);
router.use(planMiddleware);

router.get('/', async (req, res) => {
  const dateStr = req.query.date;
  let where = { userId: req.userId };
  if (dateStr) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);
    where.createdAt = { gte: start, lte: end };
  }

  const visits = await req.prisma.visit.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  res.json(visits);
});

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Nome do cliente é obrigatório'),
    body('address').notEmpty().withMessage('Endereço é obrigatório'),
    body('number').notEmpty().withMessage('Número é obrigatório'),
    body('neighborhood').notEmpty().withMessage('Bairro é obrigatório'),
    body('city').notEmpty().withMessage('Cidade é obrigatória'),
    body('zipCode').notEmpty().withMessage('CEP é obrigatório'),
    body('phone').notEmpty().withMessage('Telefone é obrigatório'),
    body('timeWindow').optional().isIn(['morning', 'afternoon', 'none']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, number, neighborhood, city, zipCode, phone, timeWindow } = req.body;

    const visit = await req.prisma.visit.create({
      data: {
        userId: req.userId,
        name,
        address,
        number,
        neighborhood,
        city,
        zipCode,
        phone,
        timeWindow: timeWindow || 'none',
        status: 'draft',
      },
    });

    res.status(201).json(visit);
  }
);

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const visit = await req.prisma.visit.findFirst({ where: { id, userId: req.userId } });
  if (!visit) return res.status(404).json({ error: 'Visita não encontrada' });

  const { name, address, number, neighborhood, city, zipCode, phone, timeWindow, status } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (address !== undefined) data.address = address;
  if (number !== undefined) data.number = number;
  if (neighborhood !== undefined) data.neighborhood = neighborhood;
  if (city !== undefined) data.city = city;
  if (zipCode !== undefined) data.zipCode = zipCode;
  if (phone !== undefined) data.phone = phone;
  if (timeWindow !== undefined) data.timeWindow = timeWindow;
  if (status !== undefined) data.status = status;

  const updated = await req.prisma.visit.update({ where: { id }, data });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const visit = await req.prisma.visit.findFirst({ where: { id, userId: req.userId } });
  if (!visit) return res.status(404).json({ error: 'Visita não encontrada' });

  await req.prisma.visit.delete({ where: { id } });
  res.json({ message: 'Visita removida' });
});

router.post('/:id/duplicate', async (req, res) => {
  const { id } = req.params;
  const original = await req.prisma.visit.findFirst({ where: { id, userId: req.userId } });
  if (!original) return res.status(404).json({ error: 'Visita não encontrada' });

  const visit = await req.prisma.visit.create({
    data: {
      userId: req.userId,
      name: `${original.name} (cópia)`,
      address: original.address,
      number: original.number,
      neighborhood: original.neighborhood,
      city: original.city,
      zipCode: original.zipCode,
      phone: original.phone,
      timeWindow: original.timeWindow,
      status: 'draft',
    },
  });

  res.status(201).json(visit);
});

export default router;
