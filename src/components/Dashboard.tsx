import React from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { useStoreData } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, DollarSign, BarChart3, TrendingUp, CheckCircle, MessageSquare, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { useToast } from '../lib/Toast';
import { getWhatsappLink, aggregateDebtsByCustomer } from '../lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const { customers = [], debts = [], storeSettings } = useStoreData();
  const { toast } = useToast();
  
  const pendingDebts = debts.filter(d => d.status !== 'Paga');
  const paidDebts = debts.filter(d => d.status === 'Paga');
  const totalDue = pendingDebts.reduce((sum, d) => sum + d.value, 0);
  const totalPaid = paidDebts.reduce((sum, d) => sum + d.value, 0);
  const activeCustomers = customers.filter(c => c.status === 'Ativo').length;
  
  const debtsByCustomer = aggregateDebtsByCustomer(pendingDebts);
  
  const topDebtorId = Object.entries(debtsByCustomer).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topDebtor = customers.find(c => c.customerId === topDebtorId);

  // Sorting pending debts by dueDate (oldest first)
  const pendentes = [...pendingDebts].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);
  
  // Recent payments
  const recentesPagas = [...paidDebts].slice(-5).reverse();



  // Chart data configuration (past 6 months)
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
      monthlyData[monthYear].pagas += Number(d.value);
    } else {
      monthlyData[monthYear].criadas += Number(d.value);
    }
  });

  const chartData = Object.values(monthlyData)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-6);

  const displayChartData = chartData.length > 0 ? chartData : [
    { name: 'Sem dados', criadas: 0, pagas: 0 }
  ];

  const handleMarkAsPaid = async (debtId: string) => {
    if (!user) return;

    try {
      const debtRef = doc(db, 'stores', user.uid, 'debts', debtId);
      await updateDoc(debtRef, { status: 'Paga' });
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
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

  return (
    <Layout>
      <div className="font-sans text-slate-800 max-w-7xl mx-auto pb-12">
        <h1 className="text-3xl font-black mb-8 text-slate-900 tracking-tight">Painel de Controle</h1>
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 flex items-center hover:scale-[1.02] transition-transform">
            <div className="p-3 bg-emerald-50 rounded-xl mr-4 text-emerald-600 border border-emerald-100"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Clientes</p>
              <h3 className="text-2xl font-black text-slate-900">{customers.length}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 flex items-center hover:scale-[1.02] transition-transform">
            <div className="p-3 bg-blue-50 rounded-xl mr-4 text-blue-600 border border-blue-100"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Valor Recebido</p>
              <h3 className="text-2xl font-black text-slate-900">R$ {totalPaid.toFixed(2)}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 flex items-center hover:scale-[1.02] transition-transform">
            <div className="p-3 bg-red-50 rounded-xl mr-4 text-red-600 border border-red-100"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Valor Devido</p>
              <h3 className="text-2xl font-black text-slate-900">R$ {totalDue.toFixed(2)}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 flex items-center hover:scale-[1.02] transition-transform">
            <div className="p-3 bg-amber-50 rounded-xl mr-4 text-amber-600 border border-amber-100"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Top Devedor</p>
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{topDebtor ? topDebtor.name : '-'}</h3>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-slate-200/60">
          <h2 className="text-lg font-bold mb-4 text-slate-900">Dívidas Pendentes vs Pagas (por Mês)</h2>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Bar name="Pendentes (R$)" dataKey="criadas" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar name="Pagas (R$)" dataKey="pagas" fill="#10B981" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Table Pendentes */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Dívidas Pendentes (Próximas ao Vencimento)</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-100">
                  <th className="pb-3 px-2 font-bold">Cliente</th>
                  <th className="pb-3 px-2 font-bold">Valor</th>
                  <th className="pb-3 px-2 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {pendentes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400 font-medium">Nenhuma dívida pendente.</td>
                  </tr>
                ) : (
                  pendentes.map(debt => {
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
                        <td className="py-3 px-2 text-red-600 font-extrabold">R$ {debt.value.toFixed(2)}</td>
                        <td className="py-3 px-2 text-right flex gap-2 justify-end">
                          <button 
                            onClick={() => handleMarkAsPaid(debt.debtId)} 
                            className="bg-emerald-150 text-emerald-700 p-1.5 rounded-full hover:bg-emerald-200 transition-colors flex items-center justify-center cursor-pointer"
                            title="Marcar como Pago"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          {customer?.phone && (
                            <a 
                              href={getWhatsappLink(customer.phone, debt.customerName || customer.name, debt.value, storeSettings?.whatsappMessage)} 
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Pagamentos Recentes</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-100">
                  <th className="pb-3 px-2 font-bold">Cliente</th>
                  <th className="pb-3 px-2 font-bold">Valor</th>
                  <th className="pb-3 px-2 font-bold">Data Venc.</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {recentesPagas.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400 font-medium">Nenhum pagamento recebido recentemente.</td>
                  </tr>
                ) : (
                  recentesPagas.map(debt => {
                     const customer = customers.find(c => c.customerId === debt.customerId);
                    return (
                      <tr key={debt.debtId} className="border-t border-emerald-50 bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                        <td className="py-3 px-2 text-slate-800 font-bold truncate max-w-[150px]">{debt.customerName || customer?.name || 'Desconhecido'}</td>
                        <td className="py-3 px-2 text-emerald-600 font-extrabold">R$ {debt.value.toFixed(2)}</td>
                        <td className="py-3 px-2 text-slate-500 text-xs font-semibold">{debt.dueDate}</td>
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
