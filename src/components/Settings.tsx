import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useAuth } from '../context/AuthContext';
import { useStoreData } from '../lib/hooks';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import UpgradeModal from './UpgradeModal';
import { Settings as SettingsIcon, Shield, Key, Sparkles, AlertTriangle, HelpCircle, HardDrive, RefreshCw } from 'lucide-react';

export default function Settings() {
    const { user } = useAuth();
    const { storeInfo } = useStoreData();
    const [shopName, setShopName] = useState('');
    const [userName, setUserName] = useState('');
    const [defaultCreditLimit, setDefaultCreditLimit] = useState<number | ''>('');
    const [saving, setSaving] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Reset State
    const [resetLoading, setResetLoading] = useState(false);

    const isPro = storeInfo?.subscriptionStatus === 'pro';

    // Populate initial state
    useEffect(() => {
        if (storeInfo && Object.keys(storeInfo).length > 0 && !isInitialized) {
            setShopName(storeInfo.name || '');
            setUserName(storeInfo.ownerName || (user?.displayName || ''));
            const settings = storeInfo.settings || {};
            setDefaultCreditLimit(settings.defaultCreditLimit ?? '');
            setIsInitialized(true);
        }
    }, [storeInfo, isInitialized, user]);

    const handleSaveInfo = async () => {
        if (!user) return;
        setSaving(true);
        
        const localSettings = {
            defaultCreditLimit: defaultCreditLimit === '' ? undefined : Number(defaultCreditLimit),
            whatsappMessage: storeInfo.settings?.whatsappMessage || ''
        };
        const localStoreInfo = {
            ...storeInfo,
            name: shopName,
            ownerName: userName,
            settings: localSettings
        };
        
        // Save locally
        localStorage.setItem(`cache_store_info_${user.uid}`, JSON.stringify(localStoreInfo));
        localStorage.setItem(`cache_settings_${user.uid}`, JSON.stringify(localSettings));
        window.dispatchEvent(new Event('storage'));

        try {
            const storeRef = doc(db, 'stores', user.uid);
            await setDoc(storeRef, {
                name: shopName,
                ownerName: userName,
                settings: {
                    defaultCreditLimit: defaultCreditLimit === '' ? null : Number(defaultCreditLimit)
                }
            }, { merge: true });

            alert('Informações atualizadas com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Salvo localmente! (Sincronização pendente)');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser || !newPassword) return;
        setPasswordLoading(true);
        setPasswordMessage(null);

        try {
            await updatePassword(auth.currentUser, newPassword);
            setPasswordMessage({ text: 'Senha alterada com sucesso!', type: 'success' });
            setNewPassword('');
        } catch (error: any) {
            console.error('Erro ao mudar senha:', error);
            if (error.code === 'auth/requires-recent-login') {
                setPasswordMessage({ 
                    text: 'Por segurança, você precisa fazer login novamente antes de mudar a senha.', 
                    type: 'error' 
                });
            } else {
                setPasswordMessage({ text: error.message || 'Erro ao alterar senha.', type: 'error' });
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSendResetEmail = async () => {
        if (!user || !user.email) return;
        setPasswordLoading(true);
        setPasswordMessage(null);

        try {
            await sendPasswordResetEmail(auth, user.email);
            setPasswordMessage({ 
                text: 'E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.', 
                type: 'success' 
            });
        } catch (error: any) {
            console.error('Erro ao enviar email de reset:', error);
            setPasswordMessage({ text: 'Erro ao enviar email de redefinição.', type: 'error' });
        } finally {
            setPasswordLoading(false);
        }
    };

    // System Reset function ("Resolver problemas")
    const handleResetSystemData = async () => {
        if (!user) return;
        
        const confirm1 = window.confirm('ATENÇÃO: Isso excluirá permanentemente todos os clientes, dívidas e produtos cadastrados nesta loja. Esta ação NÃO pode ser desfeita. Deseja continuar?');
        if (!confirm1) return;

        const confirm2 = window.prompt('Para confirmar, digite o nome da sua loja (' + shopName + '):');
        if (confirm2 !== shopName) {
            alert('Nome da loja incorreto. Cancelado.');
            return;
        }

        setResetLoading(true);
        try {
            // Delete subcollections: customers, debts, products
            const collectionsToDelete = ['customers', 'debts', 'products'];
            for (const colName of collectionsToDelete) {
                const colRef = collection(db, 'stores', user.uid, colName);
                const snapshot = await getDocs(colRef);
                for (const docSnap of snapshot.docs) {
                    await deleteDoc(doc(db, 'stores', user.uid, colName, docSnap.id));
                }
            }

            // Clear cache
            localStorage.removeItem(`cache_customers_${user.uid}`);
            localStorage.removeItem(`cache_debts_${user.uid}`);
            localStorage.removeItem(`cache_products_${user.uid}`);
            window.dispatchEvent(new Event('storage'));

            alert('Dados da conta limpos com sucesso! O sistema foi redefinido.');
        } catch (error) {
            console.error('Erro ao resetar dados:', error);
            alert('Ocorreu um erro ao limpar os dados.');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto font-sans text-slate-800 pb-12">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <SettingsIcon className="w-6 h-6 text-emerald-600" /> Configurações da Conta
                    </h1>
                    <p className="text-sm text-slate-500">Gerencie sua senha, dados do comércio e obtenha suporte técnico.</p>
                </div>

                {/* PRO Subscription Status Ribbon */}
                <div className="mb-6">
                    {isPro ? (
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-2xl border border-emerald-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Sparkles className="w-5 h-5 fill-white text-emerald-300" />
                                    <span className="font-extrabold text-sm uppercase tracking-wider">Membro PRO</span>
                                </div>
                                <p className="text-xs text-emerald-100 leading-relaxed max-w-xl">
                                    Sua assinatura está ativa! Todos os recursos estão 100% liberados (clientes e produtos ilimitados, WhatsApp customizado). Obrigado pelo suporte!
                                </p>
                            </div>
                            <span className="bg-white/20 border border-white/30 text-xs font-bold px-4 py-2 rounded-xl">
                                Ativo ✨
                            </span>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                    <span className="font-bold text-sm text-slate-200 uppercase tracking-wider">Plano Gratuito</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                                    Sua conta possui limites de até 10 clientes e 10 produtos de estoque. Faça o upgrade agora para usufruir de cadastros ilimitados.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowUpgradeModal(true)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl transition text-xs cursor-pointer shadow-md shadow-emerald-500/10 shrink-0"
                            >
                                Fazer Upgrade PRO
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1: Store Information */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-950 text-sm pb-2 border-b border-slate-100 flex items-center gap-1.5">
                            <HardDrive className="w-4 h-4 text-emerald-600" /> Dados do Estabelecimento
                        </h3>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nome da Loja</label>
                            <input 
                                type="text" 
                                value={shopName} 
                                onChange={(e) => setShopName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                placeholder="Minha Loja"
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nome do Responsável</label>
                            <input 
                                type="text" 
                                value={userName} 
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                placeholder="Seu Nome"
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Limite de Crédito Padrão (R$)</label>
                            <input 
                                type="number" 
                                value={defaultCreditLimit} 
                                onChange={(e) => setDefaultCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                placeholder="Ex: 500"
                                disabled={saving}
                            />
                        </div>

                        <button 
                            onClick={handleSaveInfo}
                            disabled={saving}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition text-xs shadow-sm shadow-emerald-600/10 cursor-pointer disabled:opacity-50"
                        >
                            {saving ? 'Gravando...' : 'Salvar Alterações'}
                        </button>
                    </div>

                    {/* Column 2: Security & Troubleshooting */}
                    <div className="space-y-6">
                        {/* Password Reset Form */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-950 text-sm pb-2 border-b border-slate-100 flex items-center gap-1.5">
                                <Key className="w-4 h-4 text-emerald-600" /> Alterar Senha
                            </h3>

                            <form onSubmit={handleChangePassword} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nova Senha</label>
                                    <input 
                                        type="password" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                        placeholder="Min. 6 caracteres"
                                        minLength={6}
                                        required
                                    />
                                </div>

                                {passwordMessage && (
                                    <p className={`text-[10px] font-bold ${passwordMessage.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {passwordMessage.text}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <button 
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-xl transition text-xs shadow-sm cursor-pointer disabled:opacity-50"
                                    >
                                        Mudar Senha
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleSendResetEmail}
                                        disabled={passwordLoading}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl transition text-[10px] border border-slate-200/40 cursor-pointer"
                                        title="Redefinir enviando email"
                                    >
                                        Enviar E-mail Reset
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Troubleshooting & System Reset */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-950 text-sm pb-2 border-b border-slate-100 flex items-center gap-1.5">
                                <HelpCircle className="w-4 h-4 text-emerald-600" /> Suporte & Resolução de Problemas
                            </h3>

                            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                                <p>
                                    Caso encontre alguma lentidão de conexão, você pode forçar a sincronização ou limpar os dados locais de teste para recomeçar o seu negócio do zero.
                                </p>

                                <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-100 space-y-2.5">
                                    <div className="flex items-start gap-1.5">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                                        <div>
                                            <span className="font-bold text-[10px] block">Zona de Risco</span>
                                            <span className="text-[9px] text-red-600/80">Esta ação irá remover todos os clientes e devedores cadastrados permanentemente.</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleResetSystemData}
                                        disabled={resetLoading}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg transition text-[10px] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${resetLoading ? 'animate-spin' : ''}`} /> Limpar Banco de Dados da Loja
                                    </button>
                                </div>

                                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Dúvidas? Fale com a gente:</span>
                                    <a 
                                        href="https://wa.me/5511999999999?text=Preciso%20de%20ajuda%20com%20o%20CrediFácil" 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-emerald-600 font-bold hover:underline"
                                    >
                                        WhatsApp Suporte ➔
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)} 
                message="Ao assinar o Plano PRO todos os limites de cadastros de clientes e de estoque expiram para sempre!"
            />
        </Layout>
    );
}
