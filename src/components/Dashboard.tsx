import { Link } from 'react-router-dom';
import Layout from './Layout';
import { useStoreData } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, DollarSign, BarChart3, TrendingUp, CheckCircle, MessageSquare } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { customers, debts, storeSettings } = useStoreData();
  
  const pendingDebts = debts.filter(d => d.status !== 'Paga');
  const paidDebts = debts.filter(d => d.status === 'Paga');
  const totalDue = pendingDebts.reduce((sum, d) => sum + d.value, 0);
  const totalPaid = paidDebts.reduce((sum, d) => sum + d.value, 0);
  const activeCustomers = customers.filter(c => c.status === 'Ativo').length;
  
  const debtsByCustomer = pendingDebts.reduce((acc, d) => {
    acc[d.customerId] = (acc[d.customerId] || 0) + Number(d.value);
    return acc;
  }, {} as Record<string, number>);
  
  const topDebtorId = Object.entries(debtsByCustomer).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topDebtor = customers.find(c => c.customerId === topDebtorId);

  // Pendentes ordenados por vencimento (mais antigos primeiro ou mais recentes)
  const pendentes = [...pendingDebts].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);
  
  // Recentes Pagas
  const recentesPagas = [...paidDebts].slice(-5).reverse();

  // Agrupamento real por mês dos últimos 6 meses baseado em dueDate
  const monthlyData: Record<string, { name: string; criadas: number; pagas: number }> = {};
  
  debts.forEach(d => {
    const dateObj = new Date(d.dueDate);
    const monthYear = isNaN(dateObj.getTime()) 
      ? 'Outros' 
      : dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { name: monthYear, criadas: 0, pagas: 0 };
    }

    if (d.status === 'Paga') {
      monthlyData[monthYear].pagas += d.value;
    } else {
      monthlyData[monthYear].criadas += d.value;
    }
  });

  const chartData = Object.values(monthlyData)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-6);

  // Fallback se não houver dados
  const displayChartData = chartData.length > 0 ? chartData : [
    { name: 'Sem dados', criadas: 0, pagas: 0 }
  ];

  const handleMarkAsPaid = async (debtId: string) => {
    if (!user) return;
    try {
      const debtRef = doc(db, 'stores', user.uid, 'debts', debtId);
      await updateDoc(debtRef, { status: 'Paga' });
      alert('Dívida marcada como paga!');
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
      alert('Erro ao atualizar status da dívida.');
    }
  };

  const handleChargeClicked = async (debtId: string) => {
    if (!user) return;
    try {
      const debtRef = doc(db, 'stores', user.uid, 'debts', debtId);
      await updateDoc(debtRef, { lastChargedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Erro ao salvar timestamp de cobrança:', error);
    }
  };

  const getWhatsappLink = (phone: string, customerName: string, value: number) => {
    let message = storeSettings?.whatsappMessage || "Olá {cliente}! Lembrete de sua dívida no valor de R$ {valor}.";
    message = message.replace(/{cliente}/g, customerName).replace(/{valor}/g, value.toFixed(2));
    return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-8 text-gray-800 font-sans">Dashboard</h1>
      
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 font-sans">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center hover:scale-[1.02] transition-transform">
          <div className="p-3 bg-emerald-100 rounded-full mr-4"><Users className="w-8 h-8 text-emerald-600" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Clientes</p>
            <h3 className="text-3xl font-bold text-emerald-600">{customers.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center hover:scale-[1.02] transition-transform">
          <div className="p-3 bg-blue-100 rounded-full mr-4"><DollarSign className="w-8 h-8 text-blue-600" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Valor Recebido</p>
            <h3 className="text-3xl font-bold text-blue-600">R$ {totalPaid.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center hover:scale-[1.02] transition-transform">
          <div className="p-3 bg-red-100 rounded-full mr-4"><DollarSign className="w-8 h-8 text-red-600" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Valor Devido</p>
            <h3 className="text-3xl font-bold text-red-600">R$ {totalDue.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center hover:scale-[1.02] transition-transform">
          <div className="p-3 bg-amber-100 rounded-full mr-4"><TrendingUp className="w-8 h-8 text-amber-600" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Top Devedor</p>
            <h3 className="text-lg font-bold text-gray-800 truncate max-w-[150px]">{topDebtor ? topDebtor.name : '-'}</h3>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 font-sans">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Dívidas Pendentes vs Pagas (por Mês)</h2>
        <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip cursor={{fill: '#f3f4f6'}} formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Bar name="Pendentes (R$)" dataKey="criadas" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={40} />
              <Bar name="Pagas (R$)" dataKey="pagas" fill="#10B981" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans">
        {/* Table Pendentes */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Dívidas Pendentes (Próximas ao Vencimento)</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-100">
                <th className="pb-3 px-2">Cliente</th>
                <th className="pb-3 px-2">Valor</th>
                <th className="pb-3 px-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pendentes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-500">Nenhuma dívida pendente.</td>
                </tr>
              ) : (
                pendentes.map(debt => {
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
                      <td className="py-3 px-2 text-red-600 font-bold">R$ {debt.value.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right flex gap-2 justify-end">
                        <button 
                          onClick={() => handleMarkAsPaid(debt.debtId)} 
                          className="bg-emerald-100 text-emerald-700 p-1.5 rounded-full hover:bg-emerald-200 transition-colors flex items-center justify-center cursor-pointer"
                          title="Marcar como Pago"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        {customer?.phone && (
                          <a 
                            href={getWhatsappLink(customer.phone, debt.customerName || customer.name, debt.value)} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={() => handleChargeClicked(debt.debtId)}
                            className="bg-blue-100 text-blue-700 p-1.5 rounded-full hover:bg-blue-200 transition-colors flex items-center justify-center cursor-pointer"
                            title="Cobrar via WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Pagamentos */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Pagamentos Recentes</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-100">
                <th className="pb-3 px-2">Cliente</th>
                <th className="pb-3 px-2">Valor</th>
                <th className="pb-3 px-2">Data Venc.</th>
              </tr>
            </thead>
            <tbody>
              {recentesPagas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-500">Nenhum pagamento recebido recentemente.</td>
                </tr>
              ) : (
                recentesPagas.map(debt => {
                   const customer = customers.find(c => c.customerId === debt.customerId);
                  return (
                    <tr key={debt.debtId} className="border-t border-emerald-50 bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                      <td className="py-3 px-2 text-gray-800 font-medium truncate max-w-[150px]">{debt.customerName || customer?.name || 'Desconhecido'}</td>
                      <td className="py-3 px-2 text-emerald-600 font-bold">R$ {debt.value.toFixed(2)}</td>
                      <td className="py-3 px-2 text-gray-500 text-sm">{debt.dueDate}</td>
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
