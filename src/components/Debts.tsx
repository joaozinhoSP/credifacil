import React, { useState } from 'react';
import Layout from './Layout';
import { useStoreData } from '../lib/hooks';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DebtStatus } from '../types';
import { CheckCircle } from 'lucide-react';

export default function Debts() {
    const { customers, debts } = useStoreData();
    const { user } = useAuth();
    const [customerId, setCustomerId] = useState('');
    const [value, setValue] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState<DebtStatus>('Pendente');

    const handleAddDebt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !customerId || !value) return;

        try {
            const debtRef = doc(collection(db, 'stores', user.uid, 'debts'));
            await setDoc(debtRef, {
                debtId: debtRef.id,
                customerId,
                customerName: customers.find(c => c.customerId === customerId)?.name || 'Desconhecido',
                storeId: user.uid,
                value: parseFloat(value),
                description,
                dueDate,
                status,
                createdAt: new Date().toISOString()
            });
            alert('Dívida adicionada com sucesso!');
            setCustomerId('');
            setValue('');
            setDescription('');
            setDueDate('');
        } catch (error) {
            console.error('Erro ao adicionar dívida:', error);
            alert('Erro ao adicionar dívida.');
        }
    };

    const handleMarkAsPaid = async (debtId: string) => {
        if (!user) return;
        try {
            const debtRef = doc(db, 'stores', user.uid, 'debts', debtId);
            await updateDoc(debtRef, { status: 'Paga' });
            alert('Dívida marcada como paga!');
        } catch (error) {
            console.error('Erro ao atualizar status da dívida:', error);
            alert('Erro ao atualizar status.');
        }
    };

    return (
        <Layout>
            <h1 className="text-2xl font-bold mb-6 text-gray-800 font-sans">Nova Dívida</h1>
            <form onSubmit={handleAddDebt} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-lg font-sans mb-8">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <select
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                    >
                        <option value="">Selecione um cliente</option>
                        {customers.map(c => (
                            <option key={c.customerId} value={c.customerId}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0.00"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Ex: Compra de mercearia"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as DebtStatus)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="Pendente">Pendente</option>
                        <option value="Paga">Paga</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 font-medium cursor-pointer"
                >
                    Registrar Dívida
                </button>
            </form>

            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 font-sans">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Dívidas Cadastradas</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 text-sm border-b border-gray-100">
                                <th className="pb-3 px-2">Cliente</th>
                                <th className="pb-3 px-2">Valor</th>
                                <th className="pb-3 px-2">Vencimento</th>
                                <th className="pb-3 px-2">Status</th>
                                <th className="pb-3 px-2 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {debts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-gray-500">Nenhuma dívida registrada.</td>
                                </tr>
                            ) : (
                                debts.map(debt => {
                                    const customer = customers.find(c => c.customerId === debt.customerId);
                                    return (
                                        <tr key={debt.debtId} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-2 text-gray-800 font-medium truncate max-w-[150px]">
                                                {debt.customerName || customer?.name || 'Desconhecido'}
                                                {debt.lastChargedAt && (
                                                    <span className="block text-[10px] text-blue-500 font-semibold mt-0.5">
                                                        Cobrado em {new Date(debt.lastChargedAt).toLocaleDateString('pt-BR')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`py-3 px-2 font-bold ${debt.status === 'Paga' ? 'text-emerald-600' : 'text-red-600'}`}>R$ {debt.value.toFixed(2)}</td>
                                            <td className="py-3 px-2 text-gray-600">{debt.dueDate}</td>
                                            <td className="py-3 px-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                    debt.status === 'Paga' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {debt.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                {debt.status !== 'Paga' && (
                                                    <button 
                                                      onClick={() => handleMarkAsPaid(debt.debtId)} 
                                                      className="bg-emerald-100 text-emerald-700 p-1 rounded-full hover:bg-emerald-200 transition-colors inline-flex items-center justify-center cursor-pointer"
                                                      title="Marcar como Pago"
                                                    >
                                                      <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
