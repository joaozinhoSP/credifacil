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
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function LandingPage() {
    const { user } = useAuth();
    const demoRef = useRef<HTMLDivElement>(null);
    const pricingRef = useRef<HTMLDivElement>(null);
    const benefitsRef = useRef<HTMLDivElement>(null);

    const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all">
                <div className="flex justify-between items-center py-4 px-6 md:px-8 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                            <Store className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold text-slate-800 tracking-tight">CrediFácil</span>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                        <button onClick={() => scrollToSection(demoRef)} className="hover:text-emerald-600 transition cursor-pointer">Como Funciona</button>
                        <button onClick={() => scrollToSection(benefitsRef)} className="hover:text-emerald-600 transition cursor-pointer">Benefícios</button>
                        <button onClick={() => scrollToSection(pricingRef)} className="hover:text-emerald-600 transition cursor-pointer">Planos & Preços</button>
                    </nav>

                    <div className="space-x-3 flex items-center">
                        {user ? (
                            <>
                                <Link to="/dashboard" className="bg-emerald-600 text-white px-5 py-2 rounded-xl hover:bg-emerald-700 transition font-semibold text-sm shadow-md shadow-emerald-600/10">Painel de Controle</Link>
                                <button onClick={() => signOut(auth)} className="text-slate-600 hover:text-red-600 flex items-center gap-1 font-semibold text-sm cursor-pointer px-3 py-2 rounded-xl hover:bg-slate-50 transition">
                                    <LogOut className="w-4 h-4" /> Sair
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-slate-600 hover:text-emerald-600 font-semibold text-sm px-4 py-2 rounded-xl transition">Entrar</Link>
                                <Link to="/register" className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition font-semibold text-sm shadow-md shadow-emerald-600/10">Criar Conta Grátis</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-20 md:py-28 px-6 md:px-8 text-center overflow-hidden">
                {/* Background glowing decorations */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
                <div className="absolute top-10 right-10 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl pointer-events-none -z-10" />

                <div className="max-w-4xl mx-auto flex flex-col items-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/80 text-emerald-800 text-xs font-semibold mb-6 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" />
                        O melhor gerenciador de fiados do Brasil
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight max-w-3xl">
                        Acabe com a inadimplência no seu comércio
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
                        Gerencie fiados, envie mensagens automáticas de cobrança via WhatsApp e tenha relatórios de tudo o que foi pago em uma interface simples e moderna.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
                        {user ? (
                            <Link to="/dashboard" className="flex-1 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-md hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                                Acessar Meu Painel <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <Link to="/register" className="flex-1 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-md hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                                Experimentar Grátis <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                        <button onClick={() => scrollToSection(pricingRef)} className="flex-1 bg-white text-slate-800 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-md hover:bg-slate-50 transition shadow-sm">
                            Ver Planos e Preços
                        </button>
                    </div>
                </div>

                {/* Interactive CSS Dashboard Preview (Instead of Placeholder) */}
                <div className="mt-16 mx-auto max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 md:p-6 text-left relative">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                        <span className="w-3.5 h-3.5 rounded-full bg-red-400" />
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-400" />
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
                        <span className="text-xs text-slate-400 font-semibold ml-2">Painel Demonstrativo CrediFácil</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Stat Card 1 */}
                        <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-emerald-800/80 block mb-1">Total a Receber</span>
                                <span className="text-2xl font-bold text-emerald-950">R$ 4.850,00</span>
                            </div>
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        {/* Stat Card 2 */}
                        <div className="bg-gradient-to-br from-blue-50/50 to-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-blue-800/80 block mb-1">Clientes Fiadores</span>
                                <span className="text-2xl font-bold text-blue-950">42 clientes</span>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                                <UserCheck className="w-5 h-5" />
                            </div>
                        </div>
                        {/* Stat Card 3 */}
                        <div className="bg-gradient-to-br from-purple-50/50 to-purple-50 p-4 rounded-2xl border border-purple-100 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-purple-800/80 block mb-1">Taxa de Cobrança</span>
                                <span className="text-2xl font-bold text-purple-950">92% Sucesso</span>
                            </div>
                            <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center shadow-sm">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Devedores Pendentes (Exemplo)</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">3 com atraso</span>
                        </div>
                        <div className="space-y-2.5">
                            <div className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs md:text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">CS</div>
                                    <div>
                                        <p className="font-bold text-slate-800">Carlos Souza</p>
                                        <p className="text-[10px] text-slate-500">(11) 98765-4321</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-red-600">R$ 150,00</span>
                                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-emerald-100 transition">
                                        <MessageCircle className="w-3.5 h-3.5" /> Cobrar
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs md:text-sm opacity-90">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">MS</div>
                                    <div>
                                        <p className="font-bold text-slate-800">Maria Santos</p>
                                        <p className="text-[10px] text-slate-500">(11) 97777-6655</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-red-600">R$ 380,50</span>
                                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-emerald-100 transition">
                                        <MessageCircle className="w-3.5 h-3.5" /> Cobrar
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works / Demo */}
            <section ref={demoRef} className="py-20 md:py-28 px-6 md:px-8 bg-slate-100/60 border-y border-slate-200/40">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Como o CrediFácil funciona</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Tudo projetado de maneira intuitiva para se adaptar ao seu comércio, seja você um mercadinho, confecção, bar ou autônomo.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/50 hover:shadow-md transition duration-300 flex flex-col items-start">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100">
                                <Store className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">1. Cadastre seus clientes</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">Adicione os nomes e telefones de WhatsApp de todos os clientes que costumam comprar fiado com você de forma rápida.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/50 hover:shadow-md transition duration-300 flex flex-col items-start">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 border border-blue-100">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">2. Controle fiados e vendas</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">Lançar as compras é simples. Defina o valor, descreva o que foi levado e defina uma data combinada de pagamento para controle.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/50 hover:shadow-md transition duration-300 flex flex-col items-start">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 border border-purple-100">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">3. Cobre via WhatsApp</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">Com apenas um clique, gere a mensagem com os detalhes e o valor exato pendente e envie direto para o WhatsApp do devedor.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section ref={benefitsRef} className="py-20 md:py-28 px-6 md:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold mb-6">
                            Benefícios de Sobra
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">O controle total do seu comércio em suas mãos</h2>
                        <p className="text-slate-600 mb-8 leading-relaxed">
                            Esqueça o caderno de anotações que rasga ou some. Com a nossa plataforma digital segura, você acessa tudo do celular ou computador e não perde um centavo.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Redução de Inadimplência</h4>
                                    <p className="text-slate-600 text-xs mt-0.5">Lembretes amigáveis ajudam clientes a lembrarem dos pagamentos com facilidade.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Organização de Estoque</h4>
                                    <p className="text-slate-600 text-xs mt-0.5">Cadastre seus produtos e saiba o estoque disponível em tempo real.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Relatórios Automatizados</h4>
                                    <p className="text-slate-600 text-xs mt-0.5">Saiba quem são seus melhores clientes e quais estão com contas atrasadas.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col justify-between h-40">
                            <ListChecks className="w-8 h-8 text-emerald-600" />
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm mb-1">Controle de Clientes</h3>
                                <p className="text-slate-500 text-[11px] leading-relaxed">Lista digital de clientes ativos, pendentes ou bloqueados.</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col justify-between h-40">
                            <MessageCircle className="w-8 h-8 text-emerald-600" />
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm mb-1">Cobrança no Zap</h3>
                                <p className="text-slate-500 text-[11px] leading-relaxed">Mensagens geradas na hora sem precisar reescrever valores.</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col justify-between h-40">
                            <FileText className="w-8 h-8 text-emerald-600" />
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm mb-1">Histórico de Fiados</h3>
                                <p className="text-slate-500 text-[11px] leading-relaxed">Acompanhe compras antigas e pagamentos efetuados.</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col justify-between h-40">
                            <Store className="w-8 h-8 text-emerald-600" />
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm mb-1">SaaS de Multi-Lojas</h3>
                                <p className="text-slate-500 text-[11px] leading-relaxed">Perfeito para múltiplos estabelecimentos ou vendedores.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section (Higlighted PRO Plan) */}
            <section ref={pricingRef} className="py-20 md:py-28 px-6 md:px-8 bg-slate-900 text-white relative overflow-hidden rounded-t-[40px] md:rounded-t-[60px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-900/50 text-emerald-400 text-xs font-semibold mb-6">
                            💲 Preços Transparentes
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">O plano perfeito para o tamanho do seu negócio</h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">Comece a usar gratuitamente e mude para o plano PRO conforme sua loja for crescendo.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Plan */}
                        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/60 p-8 rounded-3xl flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-slate-200">Plano Gratuito</h3>
                                <p className="text-slate-400 text-xs mb-6">Para pequenos negócios que estão começando agora.</p>
                                <div className="mb-6 flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold">R$ 0</span>
                                    <span className="text-slate-400 text-xs">/sempre grátis</span>
                                </div>
                                <ul className="space-y-3.5 mb-8 text-sm text-slate-300">
                                    <li className="flex items-center gap-2">✅ Limite de até 10 clientes</li>
                                    <li className="flex items-center gap-2">✅ Limite de até 10 produtos de estoque</li>
                                    <li className="flex items-center gap-2">✅ Registro e cobrança simples</li>
                                    <li className="flex items-center gap-2 text-slate-500 line-through">❌ Mensagem de cobrança personalizada</li>
                                    <li className="flex items-center gap-2 text-slate-500 line-through">❌ Relatórios detalhados</li>
                                </ul>
                            </div>
                            <Link to="/register" className="w-full bg-slate-700 hover:bg-slate-650 text-white font-bold py-3.5 px-6 rounded-2xl transition text-center shadow-sm text-sm">
                                Começar Grátis
                            </Link>
                        </div>

                        {/* PRO Plan (Highlighted) */}
                        <div className="bg-gradient-to-br from-emerald-950/70 to-slate-900 border-2 border-emerald-500 p-8 rounded-3xl flex flex-col justify-between relative shadow-xl shadow-emerald-500/10">
                            {/* Best Offer Tag */}
                            <div className="absolute -top-3.5 right-6 bg-emerald-500 text-slate-950 text-[10px] uppercase font-black px-3.5 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1">
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
                                    <li className="flex items-center gap-2 font-semibold text-emerald-300">✅ Clientes cadastrados ILIMITADOS</li>
                                    <li className="flex items-center gap-2 font-semibold text-emerald-300">✅ Controle de Estoque ILIMITADO</li>
                                    <li className="flex items-center gap-2 font-semibold text-emerald-300">✅ Personalização da mensagem de cobrança</li>
                                    <li className="flex items-center gap-2">✅ Relatórios financeiros detalhados</li>
                                    <li className="flex items-center gap-2">✅ Suporte rápido e prioritário</li>
                                </ul>
                            </div>
                            
                            <a 
                                href="https://go.fortpayplataforma.com.br/ynpeij0fc8" 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-3.5 px-6 rounded-2xl transition text-center shadow-lg shadow-emerald-500/20 text-sm cursor-pointer"
                            >
                                Assinar Plano PRO
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 md:px-8 text-center text-slate-500 border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
                    <p>&copy; 2026 CrediFácil. Todos os direitos reservados.</p>
                    <div className="flex gap-6">
                        <span className="hover:text-slate-800 transition cursor-pointer">Termos de Uso</span>
                        <span className="hover:text-slate-800 transition cursor-pointer">Privacidade</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
