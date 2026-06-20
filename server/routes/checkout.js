import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.get('/checkout-link', authMiddleware, async (req, res) => {
  const user = await req.prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const checkoutUrl = process.env.CHECKOUT_URL;
  if (!checkoutUrl) {
    return res.status(500).json({ error: 'CHECKOUT_URL não configurada' });
  }

  const url = `${checkoutUrl}?user_id=${user.id}&email=${encodeURIComponent(user.email)}`;
  res.json({ url });
});

export default router;
