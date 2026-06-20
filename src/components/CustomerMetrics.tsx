import { useParams } from 'react-router-dom';
import Layout from './Layout';
import { useStoreData } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart2, CheckCircle, MessageSquare } from 'lucide-react';
import { useToast } from '../lib/Toast';
import { getWhatsappLink } from '../lib/utils';

export default function CustomerMetrics() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { customers, debts, storeSettings } = useStoreData();
    const { toast } = useToast();

    const customer = customers.find(c => c.customerId === id);
    const customerDebts = debts.filter(d => d.customerId === id);
    const totalDebt = customerDebts.reduce((sum, d) => sum + d.value, 0);
    const totalPaid = customerDebts.filter(d => d.status === 'Paga').reduce((sum, d) => sum + d.value, 0);

    const handleMarkAsPaid = async (debtId: string) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'stores', user.uid, 'debts', debtId), { status: 'Paga' });
            toast('Dívida marcada como paga!', 'success');
        } catch (err) {
            console.error(err);
            toast('Erro ao atualizar.', 'error');
        }
    };

    const handleChargeClicked = async (debtId: string) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'stores', user.uid, 'debts', debtId), { lastChargedAt: new Date().toISOString() });
        } catch (err) {
            console.error(err);
        }
    };

    if (!customer) return <Layout><p className="text-slate-500">Cliente não encontrado.</p></Layout>;

    return (
        <Layout>
            <div className="max-w-5xl mx-auto font-sans text-slate-800">
                <h1 className="text-3xl font-black mb-6 text-slate-900 tracking-tight flex items-center gap-2">
                    <BarChart2 className="w-8 h-8 text-emerald-600" /> Métricas: {customer.name}
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Devido</p>
                        <h3 className="text-2xl font-black text-slate-900">R$ {totalDebt.toFixed(2)}</h3>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Pago</p>
                        <h3 className="text-2xl font-black text-emerald-600">R$ {totalPaid.toFixed(2)}</h3>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                        <h3 className="text-2xl font-black text-slate-900">{customer.status}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                    <h2 className="text-lg font-bold mb-4 text-slate-900">Histórico de Dívidas</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-xs border-b border-slate-100">
                                    <th className="pb-3 px-2 font-bold">Descrição</th>
                                    <th className="pb-3 px-2 font-bold">Valor</th>
                                    <th className="pb-3 px-2 font-bold">Vencimento</th>
                                    <th className="pb-3 px-2 font-bold">Status</th>
                                    <th className="pb-3 px-2 text-right font-bold">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {customerDebts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">Nenhuma dívida registrada.</td>
                                    </tr>
                                ) : (
                                    customerDebts.map(debt => (
                                        <tr key={debt.debtId} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-2 text-slate-800 font-medium">{debt.description || '-'}</td>
                                            <td className="py-3 px-2 font-bold text-slate-900">R$ {debt.value.toFixed(2)}</td>
                                            <td className="py-3 px-2 text-slate-500">{debt.dueDate}</td>
                                            <td className="py-3 px-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                    debt.status === 'Paga' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {debt.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <div className="flex gap-1.5 justify-end">
                                                    {debt.status !== 'Paga' && (
                                                        <>
                                                            <button onClick={() => handleMarkAsPaid(debt.debtId)}
                                                                className="bg-emerald-100 text-emerald-700 p-1.5 rounded-full hover:bg-emerald-200 transition-colors inline-flex items-center justify-center cursor-pointer"
                                                                title="Marcar como Pago">
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            {customer.phone && (
                                                                <a href={getWhatsappLink(customer.phone, customer.name, debt.value, storeSettings?.whatsappMessage)}
                                                                    target="_blank" rel="noreferrer"
                                                                    onClick={() => handleChargeClicked(debt.debtId)}
                                                                    className="bg-blue-100 text-blue-700 p-1.5 rounded-full hover:bg-blue-200 transition-colors inline-flex items-center justify-center cursor-pointer"
                                                                    title="Cobrar via WhatsApp">
                                                                    <MessageSquare className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
