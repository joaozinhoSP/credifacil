import React, { useState } from 'react';
import { collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import { useStoreData } from '../lib/hooks';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, BarChart2, X, MessageSquare } from 'lucide-react';
import { Customer } from '../types';
import UpgradeModal from './UpgradeModal';

export default function Customers() {
    const { user } = useAuth();
    const { customers, debts, storeSettings, storeInfo } = useStoreData();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const pendingDebts = debts.filter(d => d.status !== 'Paga');
    const debtsByCustomer = pendingDebts.reduce((acc, d) => {
        acc[d.customerId] = (acc[d.customerId] || 0) + Number(d.value);
        return acc;
    }, {} as Record<string, number>);

    const getWhatsappLink = (phone: string, customerName: string, value: number) => {
        let message = storeSettings?.whatsappMessage || "Olá {cliente}! Lembrete de sua dívida no valor de R$ {valor}.";
        message = message.replace(/{cliente}/g, customerName).replace(/{valor}/g, value.toFixed(2));
        return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    };

    const handleChargeCustomer = async (customerId: string) => {
        if (!user) return;
        const customerDebts = pendingDebts.filter(d => d.customerId === customerId);
        for (const debt of customerDebts) {
            try {
                const debtRef = doc(db, 'stores', user.uid, 'debts', debt.debtId);
                await updateDoc(debtRef, { lastChargedAt: new Date().toISOString() });
            } catch (error) {
                console.error('Erro ao salvar timestamp de cobrança:', error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name) return;

        const isPro = storeInfo?.subscriptionStatus === 'pro';
        if (!isPro && customers.length >= 10 && !editingCustomer) {
            setShowUpgradeModal(true);
            return;
        }

        try {
            if (editingCustomer) {
                // Modo Edição
                const customerRef = doc(db, 'stores', user.uid, 'customers', editingCustomer.customerId);
                await updateDoc(customerRef, {
                    name,
                    phone
                });
                alert('Cliente atualizado com sucesso!');
                setEditingCustomer(null);
            } else {
                // Modo Adicionar
                const customerRef = doc(collection(db, 'stores', user.uid, 'customers'));
                await setDoc(customerRef, {
                    customerId: customerRef.id,
                    storeId: user.uid,
                    name,
                    phone,
                    status: 'Ativo',
                    createdAt: new Date().toISOString()
                });
                alert('Cliente adicionado com sucesso!');
            }
            setName('');
            setPhone('');
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            alert('Erro ao salvar as informações do cliente.');
        }
    };

    const handleStartEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setName(customer.name);
        setPhone(customer.phone);
    };

    const handleCancelEdit = () => {
        setEditingCustomer(null);
        setName('');
        setPhone('');
    };

    const handleDeleteCustomer = async (customerId: string) => {
        if (!user) return;
        if (window.confirm('Tem certeza que deseja excluir este cliente? Todas as informações associadas a ele serão mantidas, mas o cliente será removido da lista.')) {
            try {
                const customerRef = doc(db, 'stores', user.uid, 'customers', customerId);
                await deleteDoc(customerRef);
                alert('Cliente removido com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
                alert('Erro ao excluir o cliente.');
            }
        }
    };

    return (
        <Layout>
            <h1 className="text-2xl font-bold mb-6 text-gray-800 font-sans">Clientes</h1>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 font-sans">
                <h2 className="text-lg font-bold mb-4">
                    {editingCustomer ? 'Editar Cliente' : 'Adicionar Cliente'}
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nome</label>
                        <input 
                            type="text" 
                            placeholder="Ex: João da Silva" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                            required 
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Telefone</label>
                        <input 
                            type="text" 
                            placeholder="Ex: (11) 98765-4321" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                        <button 
                            type="submit" 
                            className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-2 rounded-md font-medium hover:bg-emerald-700 transition cursor-pointer whitespace-nowrap h-10"
                        >
                            {editingCustomer ? 'Salvar' : 'Adicionar'}
                        </button>
                        {editingCustomer && (
                            <button 
                                type="button" 
                                onClick={handleCancelEdit}
                                className="bg-gray-100 text-gray-600 p-2 rounded-md hover:bg-gray-200 transition cursor-pointer flex items-center justify-center h-10 w-10"
                                title="Cancelar edição"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {/* List */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 font-sans">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Lista de Clientes</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 text-sm border-b border-gray-100">
                                <th className="pb-3 px-2">Nome</th>
                                <th className="pb-3 px-2">Telefone</th>
                                <th className="pb-3 px-2 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-6 text-center text-gray-500">Nenhum cliente cadastrado.</td>
                                </tr>
                            ) : (
                                customers.map(c => (
                                    <tr key={c.customerId} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-2 text-gray-800 font-medium truncate max-w-[200px]">{c.name}</td>
                                        <td className="py-3 px-2 text-gray-600">{c.phone || '-'}</td>
                                        <td className="py-3 px-2 text-right flex gap-2 justify-end">
                                            {c.phone && (
                                                <a 
                                                    href={getWhatsappLink(c.phone, c.name, debtsByCustomer[c.customerId] || 0)} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    onClick={() => handleChargeCustomer(c.customerId)}
                                                    className="bg-emerald-50 text-emerald-600 p-1.5 rounded-full hover:bg-emerald-100 transition-colors flex items-center justify-center cursor-pointer"
                                                    title="Cobrar via WhatsApp"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </a>
                                            )}
                                            <Link 
                                                to={`/customer/${c.customerId}`} 
                                                className="bg-blue-50 text-blue-600 p-1.5 rounded-full hover:bg-blue-100 transition-colors flex items-center justify-center cursor-pointer"
                                                title="Métricas do Cliente"
                                            >
                                                <BarChart2 className="w-4 h-4" />
                                            </Link>
                                            <button 
                                                onClick={() => handleStartEdit(c)} 
                                                className="bg-amber-50 text-amber-600 p-1.5 rounded-full hover:bg-amber-100 transition-colors flex items-center justify-center cursor-pointer"
                                                title="Editar Cliente"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteCustomer(c.customerId)} 
                                                className="bg-red-50 text-red-600 p-1.5 rounded-full hover:bg-red-100 transition-colors flex items-center justify-center cursor-pointer"
                                                title="Excluir Cliente"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)} 
                message="Você atingiu o limite de 10 clientes cadastrados no plano gratuito. Faça o upgrade para o plano PRO para ter cadastros ilimitados!"
            />
        </Layout>
    );
}
