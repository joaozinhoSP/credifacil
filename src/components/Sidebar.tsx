import { LayoutGrid, Users, DollarSign, Settings, LogOut, Package, Sparkles, Send, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useStoreData } from '../lib/hooks';
import { clearCache } from '../lib/utils';

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose?: () => void }) {
    const { user } = useAuth();
    const { storeInfo } = useStoreData();
    const isPro = storeInfo?.subscriptionStatus === 'pro';
    const navigate = useNavigate();

    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
        { name: 'Clientes', path: '/customers', icon: Users },
        { name: 'Dívidas', path: '/debts', icon: DollarSign },
        { name: 'Estoque', path: '/inventory', icon: Package },
        { name: 'Enviar Cobrança', path: '/billing', icon: Send },
        { name: 'Configurações', path: '/settings', icon: Settings },
    ];

    const handleLogout = async () => {
        if (user) clearCache(user.uid);
        await signOut(auth);
        navigate('/');
    };

    const sidebarContent = (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full font-sans">
          <div className="p-6 flex items-center justify-between">
            <img src="/logo.png" alt="MeuNegócioPro" className="h-12 w-auto" />
            {onClose && (
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                    <X className="w-5 h-5" />
                </button>
            )}
          </div>
          
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {links.map(link => (
                <NavLink key={link.name} to={link.path} onClick={onClose} className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700': 'text-gray-600 hover:bg-gray-50'}`}>
                    <link.icon size={20} />
                    {link.name}
                </NavLink>
            ))}

            {!isPro && (
                <div className="mt-6 mx-2 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-2xl border border-emerald-100 text-center flex flex-col items-center shadow-sm">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mb-2 text-emerald-600 shadow-inner">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-emerald-800">Seja Membro PRO</h4>
                    <p className="text-[10px] text-emerald-600 mt-1 mb-3 leading-relaxed">
                        Remova os limites e libere recursos exclusivos!
                    </p>
                    <a 
                        href="https://go.fortpayplataforma.com.br/ynpeij0fc8" 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2 px-3 rounded-xl transition-all text-center cursor-pointer shadow-md shadow-emerald-600/10"
                    >
                        Assinar Plano PRO
                    </a>
                </div>
            )}
          </nav>

          <div className="p-4 border-t border-gray-150">
             <button 
               onClick={handleLogout}
               className="w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
             >
                 <LogOut size={20} />
                 Sair da Conta
             </button>
          </div>
        </aside>
    );

    return (
        <>
            {/* Desktop sidebar always visible */}
            <div className="hidden md:block h-screen sticky top-0">
                {sidebarContent}
            </div>

            {/* Mobile overlay */}
            {isOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div className="fixed inset-0 bg-black/50" onClick={onClose} />
                    <div className="relative h-full">
                        {sidebarContent}
                    </div>
                </div>
            )}
        </>
    );
}

