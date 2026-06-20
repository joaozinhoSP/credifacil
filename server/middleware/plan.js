export default async function planMiddleware(req, res, next) {
  const user = await req.prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  if (user.plan === 'paid' && user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
    await req.prisma.user.update({
      where: { id: req.userId },
      data: { plan: 'free', planExpiresAt: null },
    });
    req.userPlan = 'free';
  } else {
    req.userPlan = user.plan;
  }

  next();
}
