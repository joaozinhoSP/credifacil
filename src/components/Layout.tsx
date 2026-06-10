import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex bg-gray-100 min-h-screen font-sans text-gray-800">
            <Sidebar isOpen={isSidebarOpen} />
            <main className="flex-1 flex flex-col">
              <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-emerald-600">Menu</button>
                <h1 className="text-lg font-semibold">Dashboard de Controle</h1>
              </header>
              <div className="p-8 flex-1">
                {children}
              </div>
            </main>
        </div>
    );
}
