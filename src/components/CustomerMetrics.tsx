import { useParams } from 'react-router-dom';
import Layout from './Layout';
import { useStoreData } from '../lib/hooks';

export default function CustomerMetrics() {
    const { id } = useParams<{ id: string }>();
    const { customers, debts } = useStoreData();
    
    const customer = customers.find(c => c.customerId === id);
    const customerDebts = debts.filter(d => d.customerId === id);
    const totalDebt = customerDebts.reduce((sum, d) => sum + d.value, 0);

    if (!customer) return <Layout>Cliente não encontrado.</Layout>;

    return (
        <Layout>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Métricas: {customer.name}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Devido</p>
                    <h3 className="text-2xl font-bold text-gray-800">R$ {totalDebt.toFixed(2)}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total de Dívidas</p>
                    <h3 className="text-2xl font-bold text-gray-800">{customerDebts.length}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                    <h3 className="text-2xl font-bold text-gray-800">{customer.status}</h3>
                </div>
            </div>
            
            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Histórico de Dívidas</h2>
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-400 text-sm">
                            <th className="pb-3">Descrição</th>
                            <th className="pb-3">Valor</th>
                            <th className="pb-3">Vencimento</th>
                            <th className="pb-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customerDebts.map(debt => (
                            <tr key={debt.debtId} className="border-t border-gray-50">
                                <td className="py-3 text-gray-800">{debt.description || '-'}</td>
                                <td className="py-3 text-gray-800">R$ {debt.value.toFixed(2)}</td>
                                <td className="py-3 text-gray-600">{debt.dueDate}</td>
                                <td className="py-3 text-gray-600">{debt.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
}
