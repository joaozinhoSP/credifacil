import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import { useStoreData } from '../lib/hooks';
import { MessageSquare, Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

export default function Billing() {
    const { user } = useAuth();
    const { customers, debts, storeSettings, storeInfo } = useStoreData();
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const isPro = storeInfo?.subscriptionStatus === 'pro';

    // Populate local template state once store settings load
    useEffect(() => {
        if (storeInfo && Object.keys(storeInfo).length > 0 && !isInitialized) {
            const settings = storeInfo.settings || {};
            setWhatsappMessage(settings.whatsappMessage || '');
            setIsInitialized(true);
        }
    }, [storeInfo, isInitialized]);

    // Calculate outstanding debts per customer
    const pendingDebts = debts.filter(d => d.status !== 'Paga');
    
    const debtsByCustomer = pendingDebts.reduce((acc, d) => {
        acc[d.customerId] = (acc[d.customerId] || 0) + Number(d.value);
        return acc;
    }, {} as Record<string, number>);

    // Get the latest date a customer was charged
    const lastChargedByCustomer = pendingDebts.reduce((acc, d) => {
        if (d.lastChargedAt) {
            const date = new Date(d.lastChargedAt);
            if (!acc[d.customerId] || date > new Date(acc[d.customerId])) {
                acc[d.customerId] = d.lastChargedAt;
            }
        }
        return acc;
    }, {} as Record<string, string>);

    // Filter customers who owe money
    const owingCustomers = customers.filter(c => (debtsByCustomer[c.customerId] || 0) > 0);

    const getMessagePreview = (customerName: string, value: number) => {
        let template = whatsappMessage || "Olá {cliente}! Lembrete de sua dívida no valor de R$ {valor}.";
        if (!isPro) {
            template = "Olá {cliente}! Lembrete de sua dívida no valor de R$ {valor}.";
        }
        return template.replace(/{cliente}/g, customerName).replace(/{valor}/g, value.toFixed(2));
    };

    const handleSendCharge = async (customerId: string, phone: string, name: string, value: number) => {
        if (!user) return;

        // Open WhatsApp link in a new tab
        const finalMsg = getMessagePreview(name, value);
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

        const localSettings = {
            ...storeSettings,
            whatsappMessage: whatsappMessage
        };
        const localStoreInfo = {
            ...storeInfo,
            settings: localSettings
        };

        // Save locally for responsive UI
        localStorage.setItem(`cache_store_info_${user.uid}`, JSON.stringify(localStoreInfo));
        localStorage.setItem(`cache_settings_${user.uid}`, JSON.stringify(localSettings));
        window.dispatchEvent(new Event('storage'));

        try {
            const storeRef = doc(db, 'stores', user.uid);
            await setDoc(storeRef, {
                settings: {
                    whatsappMessage: whatsappMessage
                }
            }, { merge: true });

            alert('Modelo de mensagem salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar modelo:', error);
            alert('Salvo no navegador! (Sincronização pendente com servidor)');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                                    const lastCharged = lastChargedByCustomer[c.customerId];
                                    const msgPreview = getMessagePreview(c.name, totalDebt);

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
