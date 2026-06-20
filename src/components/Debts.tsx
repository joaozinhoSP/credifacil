import React, { useState } from 'react';
import Layout from './Layout';
import { useStoreData } from '../lib/hooks';
import { collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Debt, DebtStatus } from '../types';
import { CheckCircle, Plus, Pencil, Trash2, X, Undo2 } from 'lucide-react';
import { useToast } from '../lib/Toast';

export default function Debts() {
    const { customers, debts } = useStoreData();
    const { user } = useAuth();
    const [customerId, setCustomerId] = useState('');
    const [value, setValue] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pendente' | 'Paga'>('all');
    const [submitting, setSubmitting] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const { toast } = useToast();

    const handleAddDebt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !customerId || !value || submitting) return;

        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
            toast('O valor da dívida deve ser maior que zero.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            if (editingDebt) {
                const debtRef = doc(db, 'stores', user.uid, 'debts', editingDebt.debtId);
                await updateDoc(debtRef, {
                    customerId,
                    customerName: customers.find(c => c.customerId === customerId)?.name || 'Desconhecido',
                    value: numValue,
                    description,
                    dueDate,
                });
                toast('Dívida atualizada com sucesso!', 'success');
                setEditingDebt(null);
            } else {
                const debtRef = doc(collection(db, 'stores', user.uid, 'debts'));
                const newDebt = {
                    debtId: debtRef.id,
                    customerId,
                    customerName: customers.find(c => c.customerId === customerId)?.name || 'Desconhecido',
                    storeId: user.uid,
                    value: numValue,
                    description,
                    dueDate,
                    status: 'Pendente' as const,
                    createdAt: new Date().toISOString()
                };
                await setDoc(debtRef, newDebt);
                toast('Dívida registrada com sucesso!', 'success');
            }
            setCustomerId('');
            setValue('');
            setDescription('');
            setDueDate('');
        } catch (error) {
            console.error('Erro ao adicionar dívida:', error);
            toast('Erro ao salvar no servidor.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStartEdit = (debt: Debt) => {
        setEditingDebt(debt);
        setCustomerId(debt.customerId);
        setValue(debt.value.toString());
        setDescription(debt.description || '');
        setDueDate(debt.dueDate);
    };

    const handleCancelEdit = () => {
        setEditingDebt(null);
        setCustomerId('');
        setValue('');
        setDescription('');
        setDueDate('');
    };

    const handleDeleteDebt = async (debtId: string) => {
        if (!user) return;
        if (!window.confirm('Tem certeza que deseja excluir esta dívida?')) return;
        try {
            await deleteDoc(doc(db, 'stores', user.uid, 'debts', debtId));
            toast('Dívida excluída!', 'success');
        } catch (error) {
            console.error('Erro ao excluir dívida:', error);
            toast('Erro ao excluir.', 'error');
        }
    };

    const handleMarkAsPaid = async (debtId: string) => {
        if (!user) return;
        try {
            const debtRef = doc(db, 'stores', user.uid, 'debts', debtId);
            await updateDoc(debtRef, { status: 'Paga' });
            toast('Dívida marcada como paga!', 'success');
        } catch (error) {
            console.error('Erro ao atualizar status da dívida:', error);
            toast('Erro ao atualizar.', 'error');
        }
    };

    const handleRevertToFiado = async (debtId: string) => {
        if (!user) return;
        try {
            const debtRef = doc(db, 'stores', user.uid, 'debts', debtId);
            await updateDoc(debtRef, { status: 'Pendente' });
            toast('Dívida revertida para pendente!', 'success');
        } catch (error) {
            console.error('Erro ao reverter dívida:', error);
            toast('Erro ao reverter.', 'error');
        }
    };

    const filteredDebts = statusFilter === 'all'
        ? debts
        : debts.filter(d => d.status === statusFilter);

    return (
        <Layout>
            <div className="max-w-5xl mx-auto font-sans text-slate-800">
                <h1 className="text-3xl font-black mb-6 text-slate-900 tracking-tight flex items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-emerald-600" /> Registrar Dívida
                </h1>

                <form onSubmit={handleAddDebt} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 mb-8 max-w-2xl">
                    <h2 className="text-lg font-bold mb-4 text-slate-900">{editingDebt ? 'Editar Dívida' : 'Nova Dívida'}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</label>
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10"
                                required
                            >
                                <option value="">Selecione um cliente</option>
                                {customers.map(c => (
                                    <option key={c.customerId} value={c.customerId}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor (R$)</label>
                            <input
                                type="number" step="0.01" value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10"
                                placeholder="0.00" required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Descrição</label>
                            <input type="text" value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10"
                                placeholder="Ex: Compra de mercearia"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Vencimento</label>
                            <input type="date" value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10"
                                required
                            />
                        </div>
                        <div className="sm:col-span-2 flex items-end gap-2">
                            <button type="submit"
                                disabled={submitting}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-bold transition cursor-pointer h-10 text-sm shadow-sm shadow-emerald-600/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" /> {submitting ? 'Salvando...' : (editingDebt ? 'Salvar' : 'Registrar Dívida')}
                            </button>
                            {editingDebt && (
                                <button type="button" onClick={handleCancelEdit}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 rounded-xl font-bold transition cursor-pointer h-10 text-sm flex items-center gap-1 border border-slate-200">
                                    <X className="w-4 h-4" /> Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Dívidas Cadastradas</h2>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                            className="px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            <option value="all">Todas</option>
                            <option value="Pendente">Pendentes</option>
                            <option value="Paga">Pagas</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-xs border-b border-slate-100">
                                    <th className="pb-3 px-2 font-bold">Cliente</th>
                                    <th className="pb-3 px-2 font-bold">Valor</th>
                                    <th className="pb-3 px-2 font-bold">Vencimento</th>
                                    <th className="pb-3 px-2 font-bold">Status</th>
                                    <th className="pb-3 px-2 text-right font-bold">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {filteredDebts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">Nenhuma dívida encontrada.</td>
                                    </tr>
                                ) : (
                                    filteredDebts.map(debt => {
                                        const customer = customers.find(c => c.customerId === debt.customerId);
                                        return (
                                            <tr key={debt.debtId} className="border-t border-slate-150 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 px-2 text-slate-800 font-bold truncate max-w-[150px]">
                                                    {debt.customerName || customer?.name || 'Desconhecido'}
                                                    {debt.lastChargedAt && (
                                                        <span className="block text-[9px] text-blue-500 font-semibold mt-0.5">
                                                            Cobrado em {new Date(debt.lastChargedAt).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`py-3 px-2 font-bold ${debt.status === 'Paga' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    R$ {debt.value.toFixed(2)}
                                                </td>
                                                <td className="py-3 px-2 text-slate-600">{debt.dueDate}</td>
                                                <td className="py-3 px-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        debt.status === 'Paga' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {debt.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <div className="flex gap-1.5 justify-end">
                                                        {debt.status !== 'Paga' ? (
                                                            <button
                                                                onClick={() => handleMarkAsPaid(debt.debtId)}
                                                                className="bg-emerald-100 text-emerald-700 p-1.5 rounded-full hover:bg-emerald-200 transition-colors inline-flex items-center justify-center cursor-pointer"
                                                                title="Marcar como Pago"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleRevertToFiado(debt.debtId)}
                                                                className="bg-orange-100 text-orange-700 p-1.5 rounded-full hover:bg-orange-200 transition-colors inline-flex items-center justify-center cursor-pointer"
                                                                title="Reverter para Pendente"
                                                            >
                                                                <Undo2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleStartEdit(debt)}
                                                            className="bg-amber-50 text-amber-600 p-1.5 rounded-full hover:bg-amber-100 transition-colors inline-flex items-center justify-center cursor-pointer"
                                                            title="Editar"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteDebt(debt.debtId)}
                                                            className="bg-red-50 text-red-600 p-1.5 rounded-full hover:bg-red-100 transition-colors inline-flex items-center justify-center cursor-pointer"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
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
        </Layout>
    );
}
