import React, { useState } from 'react';
import { collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import { useStoreData } from '../lib/hooks';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, BarChart2, X, MessageSquare, Plus, Users } from 'lucide-react';
import { Customer } from '../types';
import UpgradeModal from './UpgradeModal';
import { useToast } from '../lib/Toast';
import { getWhatsappLink, aggregateDebtsByCustomer } from '../lib/utils';

export default function Customers() {
    const { user } = useAuth();
    const { customers = [], debts = [], storeSettings, storeInfo } = useStoreData();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    const pendingDebts = debts.filter(d => d.status !== 'Paga');
    const debtsByCustomer = aggregateDebtsByCustomer(pendingDebts);

    const handleChargeCustomer = async (customerId: string) => {
        if (!user) return;
        const customerDebts = pendingDebts.filter(d => d.customerId === customerId);
        
        const nowStr = new Date().toISOString();

        for (const debt of customerDebts) {
            try {
                const debtRef = doc(db, 'stores', user.uid, 'debts', debt.debtId);
                await updateDoc(debtRef, { lastChargedAt: nowStr });
            } catch (error) {
                console.error('Erro ao salvar timestamp de cobrança:', error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name || submitting) return;

        const isPro = storeInfo?.subscriptionStatus === 'pro';
        if (!isPro && customers.length >= 10 && !editingCustomer) {
            setShowUpgradeModal(true);
            return;
        }

        setSubmitting(true);
        try {
            if (editingCustomer) {
                const customerRef = doc(db, 'stores', user.uid, 'customers', editingCustomer.customerId);
                await updateDoc(customerRef, { name, phone });
                toast('Cliente atualizado com sucesso!', 'success');
                setEditingCustomer(null);
            } else {
                const customerRef = doc(collection(db, 'stores', user.uid, 'customers'));
                const newCustomer = {
                    customerId: customerRef.id,
                    storeId: user.uid,
                    name,
                    phone,
                    status: 'Ativo' as const,
                    createdAt: new Date().toISOString()
                };
                await setDoc(customerRef, newCustomer);
                toast('Cliente adicionado com sucesso!', 'success');
            }
            setName('');
            setPhone('');
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            toast('Erro ao salvar no servidor. Os dados foram salvos no navegador.', 'error');
        } finally {
            setSubmitting(false);
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
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                const customerRef = doc(db, 'stores', user.uid, 'customers', customerId);
                await deleteDoc(customerRef);
                toast('Cliente excluído com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
                toast('Erro ao excluir cliente. Tente novamente.', 'error');
            }
        }
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto font-sans text-slate-800">
                <h1 className="text-3xl font-black mb-6 text-slate-900 tracking-tight flex items-center gap-2">
                    <Users className="w-8 h-8 text-emerald-600" /> Clientes & Fiadores
                </h1>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 mb-6 max-w-3xl">
                    <h2 className="text-lg font-bold mb-4">
                        {editingCustomer ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                        <div className="flex-1 w-full space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome Completo</label>
                            <input 
                                type="text" 
                                placeholder="Ex: João da Silva" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10" 
                                required 
                            />
                        </div>
                        <div className="flex-1 w-full space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Telefone (WhatsApp)</label>
                            <input 
                                type="text" 
                                placeholder="Ex: (11) 98765-4321" 
                                value={phone} 
                                onChange={e => setPhone(e.target.value)} 
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10" 
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap h-10 text-xs shadow-sm shadow-emerald-600/10 disabled:opacity-50"
                            >
                                {submitting ? 'Salvando...' : (editingCustomer ? 'Salvar' : 'Adicionar')}
                            </button>
                            {editingCustomer && (
                                <button 
                                    type="button" 
                                    onClick={handleCancelEdit}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-xl transition cursor-pointer flex items-center justify-center h-10 w-10 border border-slate-200"
                                    title="Cancelar edição"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                    <h2 className="text-lg font-bold mb-4 text-slate-900">Lista de Clientes</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-xs border-b border-slate-100">
                                    <th className="pb-3 px-2 font-bold">Nome</th>
                                    <th className="pb-3 px-2 font-bold">Telefone</th>
                                    <th className="pb-3 px-2 font-bold">Dívida Total</th>
                                    <th className="pb-3 px-2 text-right font-bold">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {customers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">Nenhum cliente cadastrado.</td>
                                    </tr>
                                ) : (
                                    customers.map(c => {
                                        const totalDebt = debtsByCustomer[c.customerId] || 0;
                                        return (
                                            <tr key={c.customerId} className="border-t border-slate-150 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 px-2 text-slate-900 font-bold truncate max-w-[200px]">{c.name}</td>
                                                <td className="py-3 px-2 text-slate-600">{c.phone || '-'}</td>
                                                <td className="py-3 px-2">
                                                    {totalDebt > 0 ? (
                                                        <span className="bg-red-50 text-red-700 border border-red-100 font-bold px-2 py-0.5 rounded-full">
                                                            R$ {totalDebt.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2 py-0.5 rounded-full">
                                                            Sem pendências
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-2 text-right flex gap-2 justify-end">
                                                    {c.phone && totalDebt > 0 && (
                                                        <a 
                                                            href={getWhatsappLink(c.phone, c.name, totalDebt, storeSettings?.whatsappMessage)} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            onClick={() => handleChargeCustomer(c.customerId)}
                                                            className="bg-emerald-50 text-emerald-600 p-1.5 rounded-full hover:bg-emerald-100 transition flex items-center justify-center cursor-pointer"
                                                            title="Cobrar via WhatsApp"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                    <Link 
                                                        to={`/customer/${c.customerId}`} 
                                                        className="bg-blue-50 text-blue-600 p-1.5 rounded-full hover:bg-blue-100 transition flex items-center justify-center cursor-pointer"
                                                        title="Métricas do Cliente"
                                                    >
                                                        <BarChart2 className="w-3.5 h-3.5" />
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleStartEdit(c)} 
                                                        className="bg-amber-50 text-amber-600 p-1.5 rounded-full hover:bg-amber-100 transition flex items-center justify-center cursor-pointer"
                                                        title="Editar Cliente"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteCustomer(c.customerId)} 
                                                        className="bg-red-50 text-red-600 p-1.5 rounded-full hover:bg-red-100 transition flex items-center justify-center cursor-pointer"
                                                        title="Excluir Cliente"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)} 
                message="Membros PRO têm acesso a cadastros de clientes ilimitados para controlar todas as transações sem limites."
            />
        </Layout>
    );
}
