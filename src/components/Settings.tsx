import { useState, useEffect } from 'react';
import Layout from './Layout';
import { useAuth } from '../context/AuthContext';
import { useStoreData } from '../lib/hooks';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import UpgradeModal from './UpgradeModal';

export default function Settings() {
    const { user } = useAuth();
    const { storeInfo } = useStoreData();
    const [shopName, setShopName] = useState('');
    const [userName, setUserName] = useState('');
    const [defaultCreditLimit, setDefaultCreditLimit] = useState<number | ''>('');
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const isPro = storeInfo?.subscriptionStatus === 'pro';

    // Sync local state instantly from cache when storeInfo becomes available
    useEffect(() => {
        if (storeInfo && Object.keys(storeInfo).length > 0 && !isInitialized) {
            setShopName(storeInfo.name || '');
            setUserName(storeInfo.ownerName || (user?.displayName || ''));
            
            const settings = storeInfo.settings || {};
            setDefaultCreditLimit(settings.defaultCreditLimit ?? '');
            setWhatsappMessage(settings.whatsappMessage || '');
            setIsInitialized(true);
        }
    }, [storeInfo, isInitialized, user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        
        // 1. Save instantly to local cache so the app updates immediately without network latency
        const localSettings = {
            defaultCreditLimit: defaultCreditLimit === '' ? undefined : Number(defaultCreditLimit),
            whatsappMessage: whatsappMessage
        };
        const localStoreInfo = {
            name: shopName,
            ownerName: userName,
            settings: localSettings
        };
        localStorage.setItem(`cache_store_info_${user.uid}`, JSON.stringify(localStoreInfo));
        localStorage.setItem(`cache_settings_${user.uid}`, JSON.stringify(localSettings));
        
        // Dispatch custom storage event to notify other components/hooks instantly
        window.dispatchEvent(new Event('storage'));

        try {
            const storeRef = doc(db, 'stores', user.uid);
            
            // Promise timeout after 6 seconds to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Sincronização em nuvem excedeu o tempo limite.')), 6000)
            );

            await Promise.race([
                setDoc(storeRef, {
                    name: shopName,
                    ownerName: userName,
                    settings: {
                        defaultCreditLimit: defaultCreditLimit === '' ? null : Number(defaultCreditLimit),
                        whatsappMessage: whatsappMessage
                    }
                }, { merge: true }),
                timeoutPromise
            ]);

            alert('Configurações salvas e sincronizadas com sucesso!');
        } catch (error: any) {
            console.error('Erro ao sincronizar configurações:', error);
            alert(`Salvo localmente! (Nota: Sincronização com a nuvem pendente ou offline)`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <h1 className="text-2xl font-bold mb-6 text-gray-800 font-sans">Configurações</h1>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-lg font-sans">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
                    <input 
                        type="text" 
                        value={shopName} 
                        onChange={(e) => setShopName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Ex: Minha Loja"
                        disabled={saving}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Usuário</label>
                    <input 
                        type="text" 
                        value={userName} 
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Ex: João da Silva"
                        disabled={saving}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Crédito Padrão (R$)</label>
                    <input 
                        type="number" 
                        value={defaultCreditLimit} 
                        onChange={(e) => setDefaultCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Ex: 500"
                        disabled={saving}
                    />
                </div>
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Template de Mensagem (WhatsApp)</label>
                        {!isPro && (
                            <button 
                                type="button"
                                onClick={() => setShowUpgradeModal(true)}
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                                ✨ Liberar no plano PRO
                            </button>
                        )}
                    </div>
                    <textarea 
                        value={isPro ? whatsappMessage : "Olá {cliente}! Lembrete de sua dívida no valor de R$ {valor}."} 
                        onChange={(e) => setWhatsappMessage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24 bg-gray-50 disabled:opacity-75 disabled:text-gray-500"
                        placeholder="Ex: Olá {cliente}, tudo bem? Passando para lembrar da sua pendência no valor de R$ {valor}."
                        disabled={saving || !isPro}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {!isPro 
                            ? "Upgrade para o plano PRO é necessário para personalizar esta mensagem." 
                            : "Use as tags {cliente} e {valor} para substituir automaticamente pelo nome do devedor e o total devido."}
                    </p>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 font-medium disabled:opacity-50 cursor-pointer w-full"
                >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)} 
                message="Personalize os modelos de mensagem de cobrança do WhatsApp para automatizar suas cobranças do seu jeito!"
            />
        </Layout>
    );
}
