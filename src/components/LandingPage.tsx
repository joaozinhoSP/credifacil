import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, MessageCircle, FileText, Store, Calendar, DollarSign, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function LandingPage() {
    const { user } = useAuth();
    const demoRef = useRef<HTMLDivElement>(null);

    const scrollToDemo = () => {
        demoRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans text-gray-900">
            {/* Header */}
            <header className="flex justify-between items-center py-6 px-8 max-w-7xl mx-auto">
                <div className="text-2xl font-bold text-emerald-600 font-sans">CrediFácil</div>
                <div className="space-x-4 flex items-center">
                    {user ? (
                        <>
                            <Link to="/dashboard" className="bg-emerald-600 text-white px-5 py-2 rounded-full hover:bg-emerald-700 transition font-semibold">Ir para o Dashboard</Link>
                            <button onClick={() => signOut(auth)} className="text-gray-600 hover:text-red-600 flex items-center gap-1 font-semibold cursor-pointer">
                                <LogOut className="w-4 h-4" /> Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-gray-600 hover:text-emerald-600">Entrar</Link>
                            <Link to="/register" className="bg-emerald-600 text-white px-5 py-2 rounded-full hover:bg-emerald-700 transition">Cadastrar</Link>
                        </>
                    )}
                </div>
            </header>

            {/* Hero */}
            <section className="py-20 px-8 text-center animate-fade-in">
                <h1 className="text-5xl font-extrabold text-gray-900 mb-6 font-sans">CrediFácil – Controle de Fiado Inteligente</h1>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-sans">Gerencie clientes que devem, receba pagamentos e evite prejuízos. Tudo de forma simples e rápida.</p>
                <div className="space-x-4">
                    {user ? (
                        <Link to="/dashboard" className="bg-emerald-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-emerald-700 transition">Ir para o Dashboard</Link>
                    ) : (
                        <Link to="/register" className="bg-emerald-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-emerald-700 transition">Começar Agora</Link>
                    )}
                    <button onClick={scrollToDemo} className="bg-white text-emerald-600 px-8 py-4 rounded-full font-semibold text-lg border border-emerald-600 hover:bg-emerald-50 transition">Ver Demonstração</button>
                </div>
                <div className="mt-16 mx-auto bg-emerald-50 w-full max-w-4xl h-64 rounded-2xl flex items-center justify-center text-emerald-600/50">
                    <p className="text-lg">Mockup do Dashboard</p>
                </div>
            </section>

            {/* Demo Section */}
            <section ref={demoRef} className="py-20 px-8 bg-[#F3F4F6]">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16 font-sans">Como o CrediFácil vai facilitar seu negócio</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <Store className="w-12 h-12 text-emerald-600 mb-6" />
                            <h3 className="text-xl font-bold mb-4 font-sans">1. Cadastre sua loja e clientes</h3>
                            <p className="text-gray-600">Comece organizando quem são seus clientes e seus contatos.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <Calendar className="w-12 h-12 text-emerald-600 mb-6" />
                            <h3 className="text-xl font-bold mb-4 font-sans">2. Controle dívidas e prazos</h3>
                            <p className="text-gray-600">Registre cada fiado e receba alertas automáticos de vencimento.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <DollarSign className="w-12 h-12 text-emerald-600 mb-6" />
                            <h3 className="text-xl font-bold mb-4 font-sans">3. Receba pagamentos</h3>
                            <p className="text-gray-600">Dê baixa no fiado facilmente e gere relatórios de tudo o que foi pago.</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-2xl font-bold mb-6">Por que você vai amar:</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                            <li className="flex items-center gap-2">✅ Reduza inadimplência em até 70%</li>
                            <li className="flex items-center gap-2">✅ Nunca mais perca dinheiro esquecido no fiado</li>
                            <li className="flex items-center gap-2">✅ Cobrança automática via WhatsApp</li>
                            <li className="flex items-center gap-2">✅ Relatórios prontos para tomar decisões</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20 px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition">
                        <ListChecks className="w-12 h-12 text-emerald-600 mb-6" />
                        <h3 className="text-2xl font-bold mb-4 font-sans">Controle Total</h3>
                        <p className="text-gray-600">Gestão completa de clientes e registro de dívidas de forma organizada.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition">
                        <MessageCircle className="w-12 h-12 text-emerald-600 mb-6" />
                        <h3 className="text-2xl font-bold mb-4 font-sans">Cobrança Fácil</h3>
                        <p className="text-gray-600">Envie lembretes de cobrança automáticos via WhatsApp com um só clique.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition">
                        <FileText className="w-12 h-12 text-emerald-600 mb-6" />
                        <h3 className="text-2xl font-bold mb-4 font-sans">Relatórios Profissionais</h3>
                        <p className="text-gray-600">Gere relatórios detalhados sobre inadimplência e receba pagamentos.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 px-8 text-center text-gray-500 border-t border-gray-200">
                <p>&copy; 2026 CrediFácil. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}
