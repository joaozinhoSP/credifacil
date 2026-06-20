import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import { useStoreData } from '../lib/hooks';
import { MessageSquare, Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import UpgradeModal from './UpgradeModal';
import { useToast } from '../lib/Toast';
import { aggregateDebtsByCustomer, lastChargedByCustomer, getMessagePreview, formatDate } from '../lib/utils';

export default function Billing() {
    const { user } = useAuth();
    const { customers, debts, storeSettings, storeInfo } = useStoreData();
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { toast } = useToast();

    const isPro = storeInfo?.subscriptionStatus === 'pro';

    useEffect(() => {
        const msg = storeInfo?.settings?.whatsappMessage;
        if (msg) setWhatsappMessage(msg);
    }, [storeInfo?.settings?.whatsappMessage]);

    const pendingDebts = debts.filter(d => d.status !== 'Paga');
    const debtsByCustomer = aggregateDebtsByCustomer(pendingDebts);
    const lastChargedByCustomerMap = lastChargedByCustomer(pendingDebts);

    // Filter customers who owe money
    const owingCustomers = customers.filter(c => (debtsByCustomer[c.customerId] || 0) > 0);

    const previewMessage = (customerName: string, value: number) =>
        getMessagePreview(customerName, value, whatsappMessage, isPro);

    const handleSendCharge = async (customerId: string, phone: string, name: string, value: number) => {
        if (!user) return;

        const finalMsg = previewMessage(name, value);
        const formattedPhone = phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(finalMsg)}`;
        window.open(whatsappUrl, '_blank');

        // Update charge timestamp in Firestore for all pending debts of this customer
        const customerDebts = pendingDebts.filter(d => d.customerId === customerId);
        const now = new Date().toISOString();

        for (const debt of customerDebts) {
            try {
                const debtRef = doc(db, 'stores', user.uid, 'debts', debt.debtId);
                await updateDoc(debtRef, { lastChargedAt: now });
            } catch (error) {
                console.error('Erro ao salvar timestamp de cobrança:', error);
            }
        }
    };

    const handleSaveTemplate = async () => {
        if (!user) return;
        setSaving(true);

        try {
            const storeRef = doc(db, 'stores', user.uid);
            await setDoc(storeRef, {
                settings: {
                    whatsappMessage: whatsappMessage
                }
            }, { merge: true });

            toast('Modelo de mensagem salvo com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar modelo:', error);
            toast('Erro ao salvar no servidor. Tente novamente.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto font-sans text-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Send className="w-6 h-6 text-emerald-600" /> Enviar Cobranças
                        </h1>
                        <p className="text-sm text-slate-500">
                            Configure seu modelo de mensagem e realize cobranças rápidas via WhatsApp com um clique.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Template Configuration */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-slate-900 text-sm">Modelo do WhatsApp</h3>
                                {!isPro && (
                                    <button 
                                        onClick={() => setShowUpgradeModal(true)}
                                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-extrabold flex items-center gap-0.5 cursor-pointer"
                                    >
                                        <Sparkles className="w-3 h-3 fill-emerald-600" /> Liberar PRO
                                    </button>
                                )}
                            </div>

                            <textarea 
                                value={isPro ? whatsappMessage : "Olá {cliente}! Lembrete de sua dívida no valor de R$ {valor}."}
                                onChange={(e) => setWhatsappMessage(e.target.value)}
                                className={`w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-36 ${!isPro ? 'bg-slate-100/60 text-slate-500' : 'bg-white'}`}
                                placeholder="Olá {cliente}, tudo bem? Passando para lembrar da sua pendência no valor de R$ {valor}."
                                disabled={saving || !isPro}
                            />

                            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                {!isPro 
                                    ? "🔒 Somente usuários PRO podem personalizar o modelo de mensagem."
                                    : "Tags disponíveis: use {cliente} para o nome e {valor} para a pendência."}
                            </p>
                        </div>

                        {isPro && (
                            <button 
                                onClick={handleSaveTemplate}
                                disabled={saving}
                                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition text-xs shadow-sm shadow-emerald-600/10 cursor-pointer disabled:opacity-50"
                            >
                                {saving ? 'Salvando...' : 'Salvar Modelo'}
                            </button>
                        )}
                    </div>

                    {/* Right Column: Debtor List */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                        <h3 className="font-bold text-slate-900 text-sm mb-4">Clientes Com Dívida Ativa ({owingCustomers.length})</h3>

                        {owingCustomers.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                                <AlertCircle className="w-8 h-8 text-slate-300" />
                                Nenhuma cobrança pendente. Nenhum cliente ativo possui dívidas em aberto!
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                {owingCustomers.map(c => {
                                    const totalDebt = debtsByCustomer[c.customerId] || 0;
                                    const lastCharged = lastChargedByCustomerMap[c.customerId];
                                    const msgPreview = previewMessage(c.name, totalDebt);

                                    return (
                                        <div key={c.customerId} className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                                                    {c.phone && (
                                                        <span className="text-[10px] text-slate-400">({c.phone})</span>
                                                    )}
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-slate-500 text-[10px]">Devendo:</span>
                                                    <span className="font-bold text-red-600 text-sm">R$ {totalDebt.toFixed(2)}</span>
                                                </div>

                                                <div className="bg-white p-2 rounded-lg border border-slate-200/40 text-[10px] text-slate-500 mt-2 max-w-sm italic">
                                                    "{msgPreview}"
                                                </div>

                                                {lastCharged && (
                                                    <p className="text-[9px] text-emerald-600 font-semibold mt-1">
                                                        ⚡ Cobrado em: {formatDate(lastCharged)}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="shrink-0 flex items-center">
                                                {c.phone ? (
                                                    <button 
                                                        onClick={() => handleSendCharge(c.customerId, c.phone, c.name, totalDebt)}
                                                        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" /> Enviar WhatsApp
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 italic">Telefone não cadastrado</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)} 
                message="A customização do modelo da mensagem permite que você crie textos amigáveis de cobrança ideais para o perfil do seu negócio."
            />
        </Layout>
    );
}
