import { Router } from 'express';

const router = Router();

router.post('/payment', async (req, res) => {
  const secret = req.headers['x-webhook-secret'];
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Webhook secret inválido' });
  }

  const { userId, status, planDays } = req.body;

  if (!userId || !status) {
    return res.status(400).json({ error: 'userId e status são obrigatórios' });
  }

  if (status !== 'approved') {
    return res.status(200).json({ message: 'Status não é approved, ignorando' });
  }

  const days = planDays || 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  try {
    await req.prisma.user.update({
      where: { id: userId },
      data: {
        plan: 'paid',
        planExpiresAt: expiresAt,
      },
    });

    console.log(`Usuário ${userId} atualizado para plano paid até ${expiresAt}`);
    res.json({ success: true, message: 'Plano ativado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar plano:', err);
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
});

export default router;
