import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

export default function UpgradeModal({ isOpen, onClose, message }: UpgradeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-emerald-100 flex flex-col items-center text-center font-sans">
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Badge Icon */}
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600 shadow-inner">
                    <Sparkles className="w-8 h-8" />
                </div>

                {/* Header */}
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Seja Membro PRO!</h3>
                <p className="text-gray-600 mb-6 text-sm">
                    {message}
                </p>

                {/* Features List */}
                <div className="bg-emerald-50 p-4 rounded-2xl text-left text-xs text-emerald-800 mb-6 w-full space-y-2.5 border border-emerald-100/50">
                    <p className="flex items-center gap-2 font-medium">✅ Clientes cadastrados ilimitados (Grátis: limite de 10)</p>
                    <p className="flex items-center gap-2 font-medium">✅ Controle de Estoque ilimitado (Grátis: limite de 10 produtos)</p>
                    <p className="flex items-center gap-2 font-medium">✅ Personalização livre da mensagem de cobrança</p>
                    <p className="flex items-center gap-2 font-medium">✅ Relatórios financeiros detalhados e controle total</p>
                </div>

                {/* Call to Action */}
                <a 
                    href="https://go.fortpayplataforma.com.br/ynpeij0fc8" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-center cursor-pointer"
                >
                    Assinar Plano PRO
                </a>
                
                <button 
                    onClick={onClose}
                    className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition cursor-pointer"
                >
                    Continuar no plano gratuito
                </button>
            </div>
        </div>
    );
}
