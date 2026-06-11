import React from 'react';
import { AlertCircle, ShieldAlert, Sparkles, X, TrendingDown, HelpCircle, ArrowRight } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

export default function UpgradeModal({ isOpen, onClose, message }: UpgradeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative border border-red-100 flex flex-col items-center font-sans overflow-hidden">
                
                {/* Decorative Background Accent */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-50 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1 rounded-full hover:bg-slate-100"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Icon indicating Warning/Money Loss */}
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-red-100">
                    <ShieldAlert className="w-7 h-7" />
                </div>

                {/* Header */}
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2 text-center tracking-tight">
                    Você está deixando dinheiro escapar! 💸
                </h3>
                
                {/* Current limit notification */}
                <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-xl px-4 py-2.5 text-xs text-center font-medium mb-6 w-full leading-relaxed">
                    ⚠️ {message}
                </div>

                {/* Explaining the Pain Point */}
                <p className="text-slate-600 text-xs md:text-sm text-center mb-6 leading-relaxed">
                    Anotar fiado em papel ou confiar na memória sempre resulta em <strong>prejuízo</strong>. Cadernos somem, clientes esquecem e você perde o dinheiro do seu trabalho. Não deixe sua loja no vermelho por falta de controle!
                </p>

                {/* Visual Solution Box */}
                <div className="w-full space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200/65">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Com o Plano PRO você garante:
                    </h4>
                    
                    <div className="flex gap-2.5 text-xs">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <div>
                            <strong className="text-slate-800">Clientes Ilimitados:</strong>
                            <p className="text-slate-500 text-[11px] mt-0.5">Registre cada centavo vendido sem travas. Nunca mais perca uma conta.</p>
                        </div>
                    </div>

                    <div className="flex gap-2.5 text-xs">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <div>
                            <strong className="text-slate-800">Cobrança Sem Constrangimento:</strong>
                            <p className="text-slate-500 text-[11px] mt-0.5">Personalize mensagens automáticas e profissionais de WhatsApp para cobrar com educação e recuperar seu caixa rápido.</p>
                        </div>
                    </div>

                    <div className="flex gap-2.5 text-xs">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <div>
                            <strong className="text-slate-800">Estoque Sem Furos:</strong>
                            <p className="text-slate-500 text-[11px] mt-0.5">Controle de produtos ilimitado para saber exatamente o que está saindo e evitar perdas invisíveis.</p>
                        </div>
                    </div>

                    <div className="flex gap-2.5 text-xs">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <div>
                            <strong className="text-slate-800">Relatórios Financeiros:</strong>
                            <p className="text-slate-500 text-[11px] mt-0.5">Gráficos de lucros e inadimplência para você tomar as rédeas do seu comércio.</p>
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <a 
                    href="https://go.fortpayplataforma.com.br/ynpeij0fc8" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 text-center cursor-pointer flex items-center justify-center gap-2 text-sm"
                >
                    Proteger Meu Negócio e Ser PRO <ArrowRight className="w-4 h-4" />
                </a>
                
                <button 
                    onClick={onClose}
                    className="mt-3.5 text-xs text-slate-400 hover:text-slate-600 hover:underline transition cursor-pointer"
                >
                    Continuar perdendo controle no plano gratuito
                </button>
            </div>
        </div>
    );
}
