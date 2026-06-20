import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    ListChecks,
    MessageCircle,
    FileText,
    Store,
    Calendar,
    DollarSign,
    LogOut,
    Sparkles,
    TrendingUp,
    UserCheck,
    ArrowRight,
    CheckCircle2,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';

function FadeIn({ children, delay = 0, y = 40 }: { children: React.ReactNode; delay?: number; y?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    );
}

function StatCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay, ease: 'easeOut' }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-xl transition-all duration-300"
        >
            {children}
        </motion.div>
    );
}

export default function LandingPage() {
    const { user } = useAuth();
    const demoRef = useRef<HTMLDivElement>(null);
    const pricingRef = useRef<HTMLDivElement>(null);
    const benefitsRef = useRef<HTMLDivElement>(null);

    const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-500 selection:text-white overflow-x-hidden">
            {/* Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-100 transition-all"
            >
                <div className="flex justify-between items-center py-4 px-6 md:px-8 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="GestãoPro" className="h-12 w-auto" />
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                        {[
                            { label: 'Como Funciona', ref: demoRef },
                            { label: 'Benefícios', ref: benefitsRef },
                            { label: 'Planos & Preços', ref: pricingRef },
                        ].map(item => (
                            <button key={item.label} onClick={() => scrollToSection(item.ref)}
                                className="hover:text-emerald-600 transition cursor-pointer relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-emerald-600 after:transition-all hover:after:w-full"
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="space-x-3 flex items-center">
                        {user ? (
                            <>
                                <Link to="/dashboard"
                                    className="bg-emerald-600 text-white px-5 py-2 rounded-xl hover:bg-emerald-700 transition font-semibold text-sm shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30"
                                >
                                    Painel de Controle
                                </Link>
                                <button onClick={() => signOut(auth)}
                                    className="text-slate-600 hover:text-red-600 flex items-center gap-1 font-semibold text-sm cursor-pointer px-3 py-2 rounded-xl hover:bg-red-50 transition"
                                >
                                    <LogOut className="w-4 h-4" /> Sair
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login"
                                    className="text-slate-600 hover:text-emerald-600 font-semibold text-sm px-4 py-2 rounded-xl transition hover:bg-emerald-50"
                                >
                                    Entrar
                                </Link>
                                <Link to="/register"
                                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition font-semibold text-sm shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:scale-105 active:scale-95"
                                >
                                    Criar Conta Grátis
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </motion.header>

            {/* Hero Section */}
            <section className="relative py-20 md:py-32 px-6 md:px-8 text-center overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/15 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-10 left-10 w-20 h-20 bg-emerald-400/20 rounded-full blur-xl" />
                    <div className="absolute bottom-20 right-20 w-16 h-16 bg-blue-400/20 rounded-full blur-xl" />
                </div>

                <div className="max-w-4xl mx-auto flex flex-col items-center relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/80 text-emerald-800 text-xs font-semibold mb-6 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5" />
                            O melhor gerenciador de fiados do Brasil
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-4xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight max-w-4xl bg-gradient-to-r from-slate-900 via-emerald-800 to-slate-900 bg-clip-text text-transparent"
                    >
                        Acabe com a inadimplência no seu comércio
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed"
                    >
                        Gerencie fiados, envie mensagens automáticas de cobrança via WhatsApp e tenha relatórios de tudo o que foi pago em uma interface simples e moderna.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md"
                    >
                        {user ? (
                            <Link to="/dashboard"
                                className="flex-1 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-md hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                            >
                                Acessar Meu Painel <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <Link to="/register"
                                className="flex-1 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-md hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 hover:shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                            >
                                Experimentar Grátis <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                        <button onClick={() => scrollToSection(pricingRef)}
                            className="flex-1 bg-white text-slate-800 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-md hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
                        >
                            Ver Planos e Preços
                        </button>
                    </motion.div>
                </div>

                {/* Dashboard Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-16 mx-auto max-w-5xl bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl shadow-2xl p-4 md:p-6 text-left relative hover:shadow-emerald-500/5 transition-shadow duration-500"
                >
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                        <span className="w-3.5 h-3.5 rounded-full bg-red-400" />
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-400" />
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
                        <span className="text-xs text-slate-400 font-semibold ml-2">Painel Demonstrativo GestãoPro</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[
                            {
                                label: 'Total a Receber',
                                value: 'R$ 4.850,00',
                                color: 'emerald',
                                icon: <DollarSign className="w-5 h-5" />,
                                delay: 0.6
                            },
                            {
                                label: 'Clientes Fiadores',
                                value: '42 clientes',
                                color: 'blue',
                                icon: <UserCheck className="w-5 h-5" />,
                                delay: 0.7
                            },
                            {
                                label: 'Taxa de Cobrança',
                                value: '92% Sucesso',
                                color: 'purple',
                                icon: <TrendingUp className="w-5 h-5" />,
                                delay: 0.8
                            }
                        ].map(card => (
                            <motion.div
                                key={card.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: card.delay }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                className={`bg-gradient-to-br from-${card.color}-50/80 to-${card.color}-50/40 p-4 rounded-2xl border border-${card.color}-100/60 flex items-center justify-between backdrop-blur-sm`}
                            >
                                <div>
                                    <span className={`text-xs font-semibold text-${card.color}-800/80 block mb-1`}>{card.label}</span>
                                    <span className={`text-2xl font-bold text-${card.color}-950`}>{card.value}</span>
                                </div>
                                <div className={`w-10 h-10 bg-${card.color}-100 text-${card.color}-700 rounded-xl flex items-center justify-center shadow-sm`}>
                                    {card.icon}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/60 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Devedores Pendentes (Exemplo)</span>
                            <motion.span
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full"
                            >
                                3 com atraso
                            </motion.span>
                        </div>
                        <div className="space-y-2.5">
                            {[
                                { initials: 'CS', name: 'Carlos Souza', phone: '(11) 98765-4321', value: 'R$ 150,00' },
                                { initials: 'MS', name: 'Maria Santos', phone: '(11) 97777-6655', value: 'R$ 380,50' }
                            ].map(debtor => (
                                <motion.div
                                    key={debtor.name}
                                    whileHover={{ x: 4 }}
                                    className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs md:text-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm">
                                            {debtor.initials}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{debtor.name}</p>
                                            <p className="text-[10px] text-slate-500">{debtor.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-red-600">{debtor.value}</span>
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-emerald-100 transition shadow-sm">
                                            <MessageCircle className="w-3.5 h-3.5" /> Cobrar
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* How it Works */}
            <section ref={demoRef} className="py-20 md:py-28 px-6 md:px-8 bg-gradient-to-b from-slate-100/80 to-white border-y border-slate-200/40">
                <div className="max-w-7xl mx-auto">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Como o GestãoPro funciona</h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Tudo projetado de maneira intuitiva para se adaptar ao seu comércio, seja você um mercadinho, confecção, bar ou autônomo.</p>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Store className="w-6 h-6" />,
                                color: 'emerald',
                                title: '1. Cadastre seus clientes',
                                desc: 'Adicione os nomes e telefones de WhatsApp de todos os clientes que costumam comprar fiado com você de forma rápida.'
                            },
                            {
                                icon: <Calendar className="w-6 h-6" />,
                                color: 'blue',
                                title: '2. Controle fiados e vendas',
                                desc: 'Lançar as compras é simples. Defina o valor, descreva o que foi levado e defina uma data combinada de pagamento para controle.'
                            },
                            {
                                icon: <MessageCircle className="w-6 h-6" />,
                                color: 'purple',
                                title: '3. Cobre via WhatsApp',
                                desc: 'Com apenas um clique, gere a mensagem com os detalhes e o valor exato pendente e envie direto para o WhatsApp do devedor.'
                            }
                        ].map((item, i) => (
                            <FadeIn key={item.title} delay={i * 0.15}>
                                <motion.div
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-slate-200/50 hover:shadow-xl transition-all duration-300 flex flex-col items-start group"
                                >
                                    <div className={`w-12 h-12 bg-${item.color}-50 rounded-2xl flex items-center justify-center text-${item.color}-600 mb-6 border border-${item.color}-100 group-hover:scale-110 transition-transform duration-300`}>
                                        {item.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                    <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section ref={benefitsRef} className="py-20 md:py-28 px-6 md:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <FadeIn>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold mb-6">
                                Benefícios de Sobra
                            </div>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                                O controle total do seu comércio em suas mãos
                            </h2>
                            <p className="text-slate-600 mb-8 leading-relaxed text-lg">
                                Esqueça o caderno de anotações que rasga ou some. Com a nossa plataforma digital segura, você acessa tudo do celular ou computador e não perde um centavo.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { title: 'Redução de Inadimplência', desc: 'Lembretes amigáveis ajudam clientes a lembrarem dos pagamentos com facilidade.' },
                                    { title: 'Organização de Estoque', desc: 'Cadastre seus produtos e saiba o estoque disponível em tempo real.' },
                                    { title: 'Relatórios Automatizados', desc: 'Saiba quem são seus melhores clientes e quais estão com contas atrasadas.' }
                                ].map((ben, i) => (
                                    <motion.div
                                        key={ben.title}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-start gap-3 group"
                                    >
                                        <div className="p-1 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">{ben.title}</h4>
                                            <p className="text-slate-600 text-xs mt-0.5">{ben.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { icon: <ListChecks className="w-8 h-8" />, title: 'Controle de Clientes', desc: 'Lista digital de clientes ativos, pendentes ou bloqueados.' },
                            { icon: <MessageCircle className="w-8 h-8" />, title: 'Cobrança no Zap', desc: 'Mensagens geradas na hora sem precisar reescrever valores.' },
                            { icon: <FileText className="w-8 h-8" />, title: 'Histórico de Fiados', desc: 'Acompanhe compras antigas e pagamentos efetuados.' },
                            { icon: <Store className="w-8 h-8" />, title: 'Gerencie seu Negócio', desc: 'Tudo que você precisa em um só lugar: clientes, estoque e cobranças.' }
                        ].map((card, i) => (
                            <StatCard key={card.title} delay={i * 0.1}>
                                <div className="text-emerald-600 mb-4">{card.icon}</div>
                                <h3 className="font-bold text-slate-900 text-sm mb-1">{card.title}</h3>
                                <p className="text-slate-500 text-[11px] leading-relaxed">{card.desc}</p>
                            </StatCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section ref={pricingRef} className="py-20 md:py-28 px-6 md:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden rounded-t-[40px] md:rounded-t-[60px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

                <div className="max-w-7xl mx-auto relative">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-900/50 text-emerald-400 text-xs font-semibold mb-6 backdrop-blur-sm">
                                Preços Transparentes
                            </div>
                            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">O plano perfeito para o tamanho do seu negócio</h2>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Comece a usar gratuitamente e mude para o plano PRO conforme sua loja for crescendo.</p>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Plan */}
                        <FadeIn delay={0.1}>
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl flex flex-col justify-between hover:bg-white/[0.07] transition-all duration-300"
                            >
                                <div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-200">Plano Gratuito</h3>
                                    <p className="text-slate-400 text-xs mb-6">Para pequenos negócios que estão começando agora.</p>
                                    <div className="mb-6 flex items-baseline gap-1">
                                        <span className="text-4xl font-extrabold">R$ 0</span>
                                        <span className="text-slate-400 text-xs">/sempre grátis</span>
                                    </div>
                                    <ul className="space-y-3.5 mb-8 text-sm text-slate-300">
                                        <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Limite de até 10 clientes</li>
                                        <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Limite de até 10 produtos de estoque</li>
                                        <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Registro e cobrança simples</li>
                                        <li className="flex items-center gap-2 text-slate-500 line-through"><span className="text-slate-600">—</span> Mensagem de cobrança personalizada</li>
                                        <li className="flex items-center gap-2 text-slate-500 line-through"><span className="text-slate-600">—</span> Relatórios detalhados</li>
                                    </ul>
                                </div>
                                <Link to="/register"
                                    className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-6 rounded-2xl transition-all text-center shadow-sm text-sm backdrop-blur-sm"
                                >
                                    Começar Grátis
                                </Link>
                            </motion.div>
                        </FadeIn>

                        {/* PRO Plan */}
                        <FadeIn delay={0.2}>
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="bg-gradient-to-br from-emerald-950/80 to-slate-900 border-2 border-emerald-500/60 p-8 rounded-3xl flex flex-col justify-between relative shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300"
                            >
                                <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 text-[10px] uppercase font-black px-3.5 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 fill-slate-950" /> Recomendado
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold mb-2 text-emerald-400">Plano PRO</h3>
                                    <p className="text-slate-400 text-xs mb-6">Para lojas que buscam crescer sem limites ou barreiras.</p>
                                    <div className="mb-6 flex items-baseline gap-1">
                                        <span className="text-4xl font-extrabold text-white">PRO</span>
                                        <span className="text-emerald-400 text-xs font-semibold ml-2">(Acesso Imediato)</span>
                                    </div>
                                    <ul className="space-y-3.5 mb-8 text-sm text-emerald-50/90">
                                        <li className="flex items-center gap-2 font-semibold text-emerald-300"><Zap className="w-4 h-4 text-emerald-400" /> Clientes cadastrados ILIMITADOS</li>
                                        <li className="flex items-center gap-2 font-semibold text-emerald-300"><Zap className="w-4 h-4 text-emerald-400" /> Controle de Estoque ILIMITADO</li>
                                        <li className="flex items-center gap-2 font-semibold text-emerald-300"><Zap className="w-4 h-4 text-emerald-400" /> Personalização da mensagem de cobrança</li>
                                        <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Relatórios financeiros detalhados</li>
                                        <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Suporte rápido e prioritário</li>
                                    </ul>
                                </div>

                                <motion.a
                                    href="https://go.fortpayplataforma.com.br/ynpeij0fc8"
                                    target="_blank"
                                    rel="noreferrer"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-extrabold py-3.5 px-6 rounded-2xl transition-all text-center shadow-lg shadow-emerald-500/30 text-sm cursor-pointer"
                                >
                                    Assinar Plano PRO
                                </motion.a>
                            </motion.div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 md:px-8 text-center text-slate-500 border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
                    <p>&copy; 2026 GestãoPro. Todos os direitos reservados.</p>
                    <div className="flex gap-6">
                        <span className="hover:text-slate-800 transition cursor-pointer">Termos de Uso</span>
                        <span className="hover:text-slate-800 transition cursor-pointer">Privacidade</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
