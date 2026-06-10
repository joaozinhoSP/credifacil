import { LayoutGrid, Users, DollarSign, Settings, LogOut, Package } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
        { name: 'Clientes', path: '/customers', icon: Users },
        { name: 'Dívidas', path: '/debts', icon: DollarSign },
        { name: 'Estoque', path: '/inventory', icon: Package },
        { name: 'Configurações', path: '/settings', icon: Settings },
    ];

    if (!isOpen) return null;

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen font-sans">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                <LayoutGrid size={24} />
            </div>
            <span className="text-xl font-bold text-emerald-600 tracking-tight">CrediFácil</span>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            {links.map(link => (
                <NavLink key={link.name} to={link.path} className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700': 'text-gray-600 hover:bg-gray-50'}`}>
                    <link.icon size={20} />
                    {link.name}
                </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-150">
             <button 
               onClick={() => signOut(auth)} 
               className="w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
             >
                 <LogOut size={20} />
                 Sair da Conta
             </button>
          </div>
        </aside>
    );
}
