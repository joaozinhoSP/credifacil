import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-slate-100 min-h-screen font-sans text-slate-800">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10">
                    <button onClick={() => setIsSidebarOpen(true)}
                        className="text-slate-500 hover:text-emerald-600 transition cursor-pointer p-2 rounded-xl hover:bg-slate-100"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </header>
                <div className="p-4 md:p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
