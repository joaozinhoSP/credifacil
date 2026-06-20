import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  const user = await req.prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    baseAddress: user.baseAddress,
    baseLat: user.baseLat,
    baseLng: user.baseLng,
    startTime: user.startTime,
    avgServiceTime: user.avgServiceTime,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
  });
});

router.put(
  '/',
  authMiddleware,
  [
    body('baseAddress').optional().notEmpty(),
    body('startTime').optional().matches(/^\d{2}:\d{2}$/),
    body('avgServiceTime').optional().isInt({ min: 1, max: 240 }),
    body('phone').optional().notEmpty(),
    body('name').optional().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, baseAddress, startTime, avgServiceTime } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (baseAddress !== undefined) data.baseAddress = baseAddress;
    if (startTime !== undefined) data.startTime = startTime;
    if (avgServiceTime !== undefined) data.avgServiceTime = parseInt(avgServiceTime);

    const user = await req.prisma.user.update({
      where: { id: req.userId },
      data,
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      baseAddress: user.baseAddress,
      startTime: user.startTime,
      avgServiceTime: user.avgServiceTime,
    });
  }
);

export default router;
