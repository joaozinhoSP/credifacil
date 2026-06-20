import React, { useState, useEffect, useRef } from 'react';
import { collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import { useStoreData } from '../lib/hooks';
import {
    Pencil, Trash2, X, Plus, Minus, Search,
    Package, Image as ImageIcon, AlertTriangle,
    ShoppingBag, Users, BarChart3, Award, PlusCircle,
    Sparkles, Eye, CheckCircle2, MessageSquare, DollarSign
} from 'lucide-react';
import { Product, Customer, Debt } from '../types';
import UpgradeModal from './UpgradeModal';
import { useToast } from '../lib/Toast';
import { getWhatsappLink } from '../lib/utils';

export default function Inventory() {
    const { user } = useAuth();
    const { products = [], inventoryCustomers = [], inventoryDebts = [], storeInfo, storeSettings } = useStoreData();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { toast } = useToast();

    // ─── TAB NAVIGATION ─────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'inventory' | 'customers' | 'analytics'>('inventory');
    const [customersSubTab, setCustomersSubTab] = useState<'list' | 'raffle'>('list');

    // ─── PRODUCT FORM ────────────────────────────────────────────────────
    const [productName, setProductName] = useState('');
    const [productQuantity, setProductQuantity] = useState<number | ''>('');
    const [productPrice, setProductPrice] = useState<number | ''>('');
    const [productImageUrl, setProductImageUrl] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'price' | 'totalValue'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── CUSTOMER FORM (ESTOQUE ISOLATED) ────────────────────────────────
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [newCustName, setNewCustName] = useState('');
    const [newCustPhone, setNewCustPhone] = useState('');
    const [custLoading, setCustLoading] = useState(false);

    // ─── SALE MODAL ──────────────────────────────────────────────────────
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [modalCustomerId, setModalCustomerId] = useState('');
    const [modalProductId, setModalProductId] = useState('');
    const [modalQty, setModalQty] = useState<number | ''>(1);
    const [modalDueDate, setModalDueDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
    });
    const [modalDesc, setModalDesc] = useState('');
    const [modalIsNew, setModalIsNew] = useState(false);
    const [modalNewName, setModalNewName] = useState('');
    const [modalNewPhone, setModalNewPhone] = useState('');
    const [saleLoading, setSaleLoading] = useState(false);
    const submittingSale = useRef(false);

    // ─── DETAILS MODAL ───────────────────────────────────────────────────
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsCustomerId, setDetailsCustomerId] = useState('');

    // ─── INLINE DEBT EDIT ─────────────────────────────────────────────────
    const [editDebtId, setEditDebtId] = useState<string | null>(null);
    const [editDebtValue, setEditDebtValue] = useState<number | ''>('');
    const [editDebtDesc, setEditDebtDesc] = useState('');

    // ─── RAFFLE ──────────────────────────────────────────────────────────
    const [winner, setWinner] = useState<Customer | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawName, setDrawName] = useState('');

    // Target product for the sale modal
    const targetProduct = products.find(p => p.productId === modalProductId);

    // Auto-fill description when product or qty changes
    useEffect(() => {
        if (targetProduct) {
            setModalDesc(`Compra de: ${targetProduct.name} (x${modalQty})`);
        } else {
            setModalDesc('');
        }
    }, [modalProductId, modalQty, targetProduct]);

    // ─── IMAGE UPLOAD ─────────────────────────────────────────────────────
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                const MAX = 150;
                if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
                setProductImageUrl(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    // ─── PRODUCT CRUD ─────────────────────────────────────────────────────
    const handleSubmitProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !productName || productQuantity === '' || productPrice === '') return;
        const isPro = storeInfo?.subscriptionStatus === 'pro';
        if (!isPro && products.length >= 10 && !editingProduct) { setShowUpgradeModal(true); return; }
        const qty = Number(productQuantity), prc = Number(productPrice);
        try {
            if (editingProduct) {
                await updateDoc(doc(db, 'stores', user.uid, 'products', editingProduct.productId), { name: productName, quantity: qty, price: prc, imageUrl: productImageUrl });
                setEditingProduct(null);
            } else {
                const ref = doc(collection(db, 'stores', user.uid, 'products'));
                await setDoc(ref, { productId: ref.id, storeId: user.uid, name: productName, quantity: qty, price: prc, imageUrl: productImageUrl, createdAt: new Date().toISOString() });
            }
            setProductName(''); setProductQuantity(''); setProductPrice(''); setProductImageUrl('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            toast(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!', 'success');
        } catch (err) {
            console.error('Erro ao salvar produto:', err);
            toast('Erro ao salvar produto. Tente novamente.', 'error');
        }
    };

    const handleStartEdit = (p: Product) => {
        setEditingProduct(p); setProductName(p.name); setProductQuantity(p.quantity);
        setProductPrice(p.price); setProductImageUrl(p.imageUrl || '');
    };

    const handleCancelEdit = () => {
        setEditingProduct(null); setProductName(''); setProductQuantity(''); setProductPrice(''); setProductImageUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteProduct = async (id: string) => {
        if (!user || !window.confirm('Excluir este produto?')) return;
        try {
            await deleteDoc(doc(db, 'stores', user.uid, 'products', id));
            toast('Produto excluído!', 'success');
        } catch (err) {
            console.error('Erro ao excluir produto:', err);
            toast('Erro ao excluir produto.', 'error');
        }
    };

    const handleAdjustQty = async (id: string, cur: number, delta: number) => {
        if (!user) return;
        const nq = Math.max(0, cur + delta);
        try {
            await updateDoc(doc(db, 'stores', user.uid, 'products', id), { quantity: nq });
        } catch (err) {
            console.error('Erro ao ajustar quantidade:', err);
            toast('Erro ao ajustar quantidade.', 'error');
        }
    };

    const toggleSort = (field: 'name' | 'quantity' | 'price' | 'totalValue') => {
        if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        else { setSortBy(field); setSortOrder('asc'); }
    };

    const handleSelectProduct = (id: string) =>
        setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleSelectAll = (list: Product[]) =>
        setSelectedProductIds(selectedProductIds.length === list.length ? [] : list.map(p => p.productId));

    const handleDeleteSelected = async () => {
        if (!user || selectedProductIds.length === 0) return;
        if (!window.confirm(`Excluir ${selectedProductIds.length} produto(s) selecionado(s)?`)) return;
        const toDelete = [...selectedProductIds];
        setSelectedProductIds([]);
        try {
            await Promise.all(toDelete.map(id => deleteDoc(doc(db, 'stores', user.uid, 'products', id))));
            toast(`${toDelete.length} produto(s) excluído(s)!`, 'success');
        } catch (err) {
            console.error('Erro ao excluir produtos:', err);
            toast('Erro ao excluir produtos.', 'error');
        }
    };

    // ─── ADD INVENTORY CUSTOMER ───────────────────────────────────────────
    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newCustName) return;
        const isPro = storeInfo?.subscriptionStatus === 'pro';
        if (!isPro && inventoryCustomers.length >= 10) { setShowUpgradeModal(true); return; }
        setCustLoading(true);
        try {
            const ref = doc(collection(db, 'stores', user.uid, 'inventory_customers'));
            await setDoc(ref, { customerId: ref.id, storeId: user.uid, name: newCustName, phone: newCustPhone, status: 'Ativo', createdAt: new Date().toISOString() });
            setNewCustName(''); setNewCustPhone('');
            toast('Cliente cadastrado com sucesso!', 'success');
        } catch (err) {
            console.error('Erro ao cadastrar cliente:', err);
            toast('Erro ao cadastrar cliente.', 'error');
        } finally { setCustLoading(false); }
    };

    // ─── OPEN SALE MODAL ──────────────────────────────────────────────────
    const openSaleFromProduct = (p: Product) => {
        setModalProductId(p.productId); setModalCustomerId('');
        setModalIsNew(false); setModalNewName(''); setModalNewPhone('');
        setModalQty(1); setModalPayType('fiado'); setShowSaleModal(true);
    };

    const openSaleFromCustomer = (customerId: string) => {
        setModalCustomerId(customerId); setModalProductId('');
        setModalIsNew(false); setModalQty(1); setModalPayType('fiado'); setShowSaleModal(true);
    };

    // ─── REGISTER SALE ────────────────────────────────────────────────────
    const handleRegisterSale = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !targetProduct || !modalQty || submittingSale.current) return;
        if (Number(modalQty) > targetProduct.quantity) {
            toast(`Estoque insuficiente! Apenas ${targetProduct.quantity} disponíveis.`, 'error'); return;
        }
        if (modalIsNew && !modalNewName) { toast('Informe o nome do cliente.', 'error'); return; }
        if (!modalIsNew && !modalCustomerId) { toast('Selecione um cliente.', 'error'); return; }
        submittingSale.current = true;
        setSaleLoading(true);
        try {
            let custId = modalCustomerId;
            let custName = inventoryCustomers.find(c => c.customerId === modalCustomerId)?.name || 'Desconhecido';

            // Create new customer if needed
            if (modalIsNew) {
                const ref = doc(collection(db, 'stores', user.uid, 'inventory_customers'));
                await setDoc(ref, { customerId: ref.id, storeId: user.uid, name: modalNewName, phone: modalNewPhone, status: 'Ativo', createdAt: new Date().toISOString() });
                custId = ref.id; custName = modalNewName;
            }

            // Create debt — always fiado (Pendente), user marks as paid manually
            const debtRef = doc(collection(db, 'stores', user.uid, 'inventory_debts'));
            const newDebt: Debt = {
                debtId: debtRef.id, customerId: custId, customerName: custName,
                storeId: user.uid, value: targetProduct.price * Number(modalQty),
                description: modalDesc || `Compra de: ${targetProduct.name} (x${modalQty})`,
                dueDate: modalDueDate,
                status: 'Pendente',
                createdAt: new Date().toISOString()
            };
            await setDoc(debtRef, newDebt);

            // Reduce stock
            const newQty = targetProduct.quantity - Number(modalQty);
            await updateDoc(doc(db, 'stores', user.uid, 'products', targetProduct.productId), { quantity: newQty });

            const totalVal = (targetProduct.price * Number(modalQty)).toFixed(2);
            toast(`Venda registrada! Fiado lançado — R$ ${totalVal}`, 'success');

            setShowSaleModal(false);
            setModalProductId(''); setModalCustomerId(''); setModalIsNew(false);
            setModalNewName(''); setModalNewPhone(''); setModalQty(1);
        } catch (err) {
            console.error('Erro ao registrar venda:', err);
            toast('Erro ao registrar venda. Tente novamente.', 'error');
        }
        finally { setSaleLoading(false); submittingSale.current = false; }
    };

    // ─── PAY DEBT (Single) ────────────────────────────────────────────────
    const handlePayDebt = async (debtId: string) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'stores', user.uid, 'inventory_debts', debtId), { status: 'Paga' });
            toast('Dívida quitada!', 'success');
        } catch (err) {
            console.error('Erro ao quitar dívida:', err);
            toast('Erro ao quitar dívida.', 'error');
        }
    };

    // ─── PAY ALL DEBTS (Customer) ─────────────────────────────────────────
    const handlePayAllDebts = async (customerId: string) => {
        if (!user || !window.confirm('Quitar todas as dívidas pendentes deste cliente?')) return;
        const pending = inventoryDebts.filter(d => d.customerId === customerId && d.status === 'Pendente');
        try {
            await Promise.all(pending.map(d =>
                updateDoc(doc(db, 'stores', user.uid, 'inventory_debts', d.debtId), { status: 'Paga' })
            ));
            toast('Todas as dívidas foram quitadas!', 'success');
        } catch (err) {
            console.error('Erro ao quitar dívidas:', err);
            toast('Erro ao quitar dívidas.', 'error');
        }
    };

    // ─── REVERT DEBT ───────────────────────────────────────────────────────
    const handleRevertDebt = async (debtId: string) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'stores', user.uid, 'inventory_debts', debtId), { status: 'Pendente' });
            toast('Dívida revertida para pendente!', 'success');
        } catch (err) {
            console.error('Erro ao reverter dívida:', err);
            toast('Erro ao reverter dívida.', 'error');
        }
    };

    // ─── EDIT DEBT ─────────────────────────────────────────────────────────
    const handleStartEditDebt = (debt: Debt) => {
        setEditDebtId(debt.debtId);
        setEditDebtValue(debt.value);
        setEditDebtDesc(debt.description || '');
    };

    const handleCancelEditDebt = () => {
        setEditDebtId(null);
        setEditDebtValue('');
        setEditDebtDesc('');
    };

    const handleSaveEditDebt = async () => {
        if (!user || !editDebtId || editDebtValue === '' || Number(editDebtValue) <= 0) return;
        try {
            await updateDoc(doc(db, 'stores', user.uid, 'inventory_debts', editDebtId), {
                value: Number(editDebtValue),
                description: editDebtDesc,
            });
            toast('Dívida atualizada!', 'success');
            handleCancelEditDebt();
        } catch (err) {
            console.error('Erro ao atualizar dívida:', err);
            toast('Erro ao atualizar dívida.', 'error');
        }
    };

    // ─── RAFFLE ───────────────────────────────────────────────────────────
    const handleDrawWinner = () => {
        if (inventoryCustomers.length === 0) return;
        setIsDrawing(true); setWinner(null);
        let elapsed = 0;
        const timer = setInterval(() => {
            setDrawName(inventoryCustomers[Math.floor(Math.random() * inventoryCustomers.length)].name);
            elapsed += 70;
            if (elapsed >= 2000) {
                clearInterval(timer);
                setWinner(inventoryCustomers[Math.floor(Math.random() * inventoryCustomers.length)]);
                setIsDrawing(false);
            }
        }, 70);
    };

    // ─── DERIVED DATA ─────────────────────────────────────────────────────
    const now = new Date();
    const thisMonthInventoryDebts = inventoryDebts.filter(d => {
        const dt = new Date(d.createdAt || d.dueDate);
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    });
    const thisMonthSold = thisMonthInventoryDebts.reduce((s, d) => s + Number(d.value), 0);
    const thisMonthPaid = thisMonthInventoryDebts.filter(d => d.status === 'Paga').reduce((s, d) => s + Number(d.value), 0);

    // Product sales ranking
    const productSalesMap: Record<string, { name: string; qty: number; value: number }> = {};
    thisMonthInventoryDebts.forEach(d => {
        const m = d.description?.match(/Compra de:\s*(.*?)\s*\(x(\d+)\)/);
        const key = m ? m[1] : (d.description || 'Outros');
        const qty = m ? parseInt(m[2]) : 1;
        if (!productSalesMap[key]) productSalesMap[key] = { name: key, qty: 0, value: 0 };
        productSalesMap[key].qty += qty;
        productSalesMap[key].value += Number(d.value);
    });
    const sortedSales = Object.values(productSalesMap).sort((a, b) => b.value - a.value);

    // Debtors list (inventory only)
    const pendingInvDebts = inventoryDebts.filter(d => d.status === 'Pendente');
    const debtsByCustomer: Record<string, number> = {};
    pendingInvDebts.forEach(d => { debtsByCustomer[d.customerId] = (debtsByCustomer[d.customerId] || 0) + Number(d.value); });
    const debtorsList = Object.entries(debtsByCustomer)
        .map(([cid, amount]) => ({ ...inventoryCustomers.find(c => c.customerId === cid), customerId: cid, amount }))
        .sort((a, b) => b.amount - a.amount);

    // Top buyers (inventory only)
    const totalByCustomer: Record<string, number> = {};
    inventoryDebts.forEach(d => { totalByCustomer[d.customerId] = (totalByCustomer[d.customerId] || 0) + Number(d.value); });
    const topBuyers = Object.entries(totalByCustomer)
        .map(([cid, total]) => ({ ...inventoryCustomers.find(c => c.customerId === cid), customerId: cid, total }))
        .sort((a, b) => b.total - a.total);

    // Stock totals
    const totalStockValue = products.reduce((s, p) => s + Number(p.quantity) * Number(p.price), 0);
    const lowStockProducts = products.filter(p => Number(p.quantity) > 0 && Number(p.quantity) < 5);

    const filteredProducts = products.filter(p => {
        const ok = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (statusFilter === 'in_stock') return ok && Number(p.quantity) > 0;
        if (statusFilter === 'low_stock') return ok && Number(p.quantity) > 0 && Number(p.quantity) < 5;
        if (statusFilter === 'out_of_stock') return ok && Number(p.quantity) === 0;
        return ok;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        let fa: any = sortBy === 'totalValue' ? Number(a.quantity) * Number(a.price) : a[sortBy];
        let fb: any = sortBy === 'totalValue' ? Number(b.quantity) * Number(b.price) : b[sortBy];
        if (typeof fa === 'string') return sortOrder === 'asc' ? fa.localeCompare(fb) : fb.localeCompare(fa);
        return sortOrder === 'asc' ? Number(fa) - Number(fb) : Number(fb) - Number(fa);
    });

    const filteredCustomers = inventoryCustomers.filter(c =>
        c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || c.phone?.includes(customerSearchQuery)
    );

    // Details modal data
    const detailsCustomer = inventoryCustomers.find(c => c.customerId === detailsCustomerId);
    const detailsDebts = inventoryDebts.filter(d => d.customerId === detailsCustomerId).sort((a, b) => new Date(b.createdAt || b.dueDate).getTime() - new Date(a.createdAt || a.dueDate).getTime());
    const detailsTotalOwed = detailsDebts.filter(d => d.status === 'Pendente').reduce((s, d) => s + Number(d.value), 0);
    const detailsTotalSpent = detailsDebts.reduce((s, d) => s + Number(d.value), 0);



    // ─── RENDER ──────────────────────────────────────────────────────────
    return (
        <Layout>
            <div className="font-sans text-slate-800 max-w-7xl mx-auto pb-12">

                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Package className="w-8 h-8 text-emerald-600" /> Estoque Inteligente
                        </h1>
                        <p className="text-sm text-slate-500">Sistema isolado de gestão de estoque, clientes e vendas.</p>
                    </div>
                    <div className="flex border border-slate-200 bg-white rounded-xl p-1 shadow-sm flex-wrap gap-0.5">
                        {([['inventory', <Package className="w-3.5 h-3.5" />, 'Produtos & Estoque'], ['customers', <Users className="w-3.5 h-3.5" />, 'Clientes'], ['analytics', <BarChart3 className="w-3.5 h-3.5" />, 'Análise']] as const).map(([tab, icon, label]) => (
                            <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'customers') setCustomersSubTab('list'); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${activeTab === tab ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}>
                                {icon} {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ═══ TAB 1: PRODUTOS & ESTOQUE ═══════════════════════════════════ */}
                {activeTab === 'inventory' && (
                    <>
                        {/* Low stock banner */}
                        {lowStockProducts.length > 0 && (
                            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm shadow-sm">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                <div>
                                    <span className="font-bold">⚠️ Alerta de Reposição Necessária:</span> Os seguintes produtos estão com menos de 5 unidades e precisam de reposição:
                                    <span className="font-bold text-amber-950 ml-1">{lowStockProducts.map(p => p.name).join(', ')}</span>
                                </div>
                            </div>
                        )}

                        {/* Summary cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                            {[
                                { label: 'Produtos Cadastrados', value: products.length, icon: <Package className="w-5 h-5" />, color: 'emerald' },
                                { label: 'Unidades no Estoque', value: products.reduce((s, p) => s + Number(p.quantity), 0), icon: <span className="font-bold text-sm">#</span>, color: 'blue' },
                                { label: 'Faturamento Total em Estoque', value: `R$ ${totalStockValue.toFixed(2)}`, icon: <span className="font-bold text-sm">R$</span>, color: 'amber' },
                            ].map(card => (
                                <div key={card.label} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/50 flex items-center gap-4">
                                    <div className={`p-2.5 bg-${card.color}-50 rounded-lg text-${card.color}-600 border border-${card.color}-100`}>{card.icon}</div>
                                    <div>
                                        <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">{card.label}</p>
                                        <h3 className="text-xl font-black text-slate-900">{card.value}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Product form */}
                        <form onSubmit={handleSubmitProduct} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 mb-8 max-w-4xl text-xs">
                            <h2 className="text-sm font-bold mb-4 text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                <PlusCircle className="w-4 h-4 text-emerald-600" />
                                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto no Estoque'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                {/* Photo */}
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-3 bg-slate-50 h-28 relative cursor-pointer hover:border-emerald-400 transition">
                                    {productImageUrl ? (
                                        <>
                                            <img src={productImageUrl} alt="Preview" className="h-full object-contain rounded-md" />
                                            <button type="button" onClick={() => setProductImageUrl('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 cursor-pointer"><X className="w-3 h-3" /></button>
                                        </>
                                    ) : (
                                        <label className="flex flex-col items-center cursor-pointer text-slate-400 hover:text-emerald-600 w-full h-full justify-center">
                                            <ImageIcon className="w-6 h-6 mb-1" />
                                            <span className="text-[10px] font-bold uppercase">Foto</span>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" ref={fileInputRef} />
                                        </label>
                                    )}
                                </div>
                                {/* Name */}
                                <div className="md:col-span-2 space-y-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nome do Produto</label>
                                    <input type="text" placeholder="Ex: Refrigerante Lata 350ml" value={productName} onChange={e => setProductName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-10 text-xs" required />
                                </div>
                                {/* Qty */}
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Qtd. Inicial</label>
                                    <input type="number" placeholder="20" value={productQuantity} onChange={e => setProductQuantity(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-10 text-xs" required min="0" />
                                </div>
                                {/* Price */}
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Preço (R$)</label>
                                    <input type="number" step="0.01" placeholder="5.50" value={productPrice} onChange={e => setProductPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-10 text-xs" required min="0" />
                                </div>
                                {/* Buttons */}
                                <div className="md:col-span-2 flex gap-3 h-10">
                                    <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
                                        <Plus className="w-4 h-4" /> {editingProduct ? 'Salvar Alterações' : 'Adicionar ao Estoque'}
                                    </button>
                                    {editingProduct && <button type="button" onClick={handleCancelEdit} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 rounded-xl font-bold transition cursor-pointer">Cancelar</button>}
                                </div>
                            </div>
                        </form>

                        {/* Product list */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-bold text-slate-900">Estoque Geral</h2>
                                    {selectedProductIds.length > 0 && (
                                        <button onClick={handleDeleteSelected} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1.5 rounded-xl font-bold text-[10px] flex items-center gap-1 cursor-pointer">
                                            <Trash2 className="w-3.5 h-3.5" /> Excluir Selecionados ({selectedProductIds.length})
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative w-full sm:w-52">
                                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                        <input type="text" placeholder="Buscar produto..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 text-xs" />
                                    </div>
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white h-9 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                        <option value="all">Todos</option>
                                        <option value="in_stock">Em Estoque</option>
                                        <option value="low_stock">Estoque Baixo</option>
                                        <option value="out_of_stock">Sem Estoque</option>
                                    </select>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="text-slate-400 text-[10px] border-b border-slate-100 font-bold uppercase tracking-wide">
                                            <th className="pb-3 px-2 w-10"><input type="checkbox" checked={sortedProducts.length > 0 && selectedProductIds.length === sortedProducts.length} onChange={() => handleSelectAll(sortedProducts)} className="rounded border-slate-300 cursor-pointer w-4 h-4" /></th>
                                            <th className="pb-3 px-2 w-12">Foto</th>
                                            <th className="pb-3 px-2 cursor-pointer" onClick={() => toggleSort('name')}>Produto</th>
                                            <th className="pb-3 px-2 cursor-pointer" onClick={() => toggleSort('quantity')}>Estoque</th>
                                            <th className="pb-3 px-2 text-center">Ajuste</th>
                                            <th className="pb-3 px-2 cursor-pointer" onClick={() => toggleSort('price')}>Preço</th>
                                            <th className="pb-3 px-2 cursor-pointer" onClick={() => toggleSort('totalValue')}>Total</th>
                                            <th className="pb-3 px-2 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedProducts.length === 0 ? (
                                            <tr><td colSpan={8} className="py-10 text-center text-slate-400 italic">Nenhum produto cadastrado.</td></tr>
                                        ) : sortedProducts.map(p => {
                                            const qty = Number(p.quantity), prc = Number(p.price);
                                            const badge = qty === 0 ? 'bg-red-50 text-red-700 border-red-100' : qty < 5 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100';
                                            const label = qty === 0 ? 'Sem Estoque' : qty < 5 ? 'Estoque Baixo' : 'Em Estoque';
                                            return (
                                                <tr key={p.productId} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-3 px-2"><input type="checkbox" checked={selectedProductIds.includes(p.productId)} onChange={() => handleSelectProduct(p.productId)} className="rounded border-slate-300 cursor-pointer w-4 h-4" /></td>
                                                    <td className="py-3 px-2">
                                                        <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                                                            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-slate-400" />}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 font-bold text-slate-900 truncate max-w-[140px]">{p.name}</td>
                                                    <td className="py-3 px-2">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-bold text-slate-700">{qty} unid.</span>
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border w-max ${badge}`}>{label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-center">
                                                        <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                                                            <button onClick={() => handleAdjustQty(p.productId, qty, -1)} disabled={qty <= 0} className="p-1.5 hover:bg-slate-50 border-r border-slate-200 disabled:opacity-40 cursor-pointer"><Minus className="w-3 h-3" /></button>
                                                            <button onClick={() => handleAdjustQty(p.productId, qty, 1)} className="p-1.5 hover:bg-slate-50 cursor-pointer"><Plus className="w-3 h-3" /></button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 font-bold text-slate-600">R$ {prc.toFixed(2)}</td>
                                                    <td className="py-3 px-2 font-black text-slate-900">R$ {(qty * prc).toFixed(2)}</td>
                                                    <td className="py-3 px-2 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            {qty > 0 && <button onClick={() => openSaleFromProduct(p)} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-full transition cursor-pointer" title="Registrar Venda"><ShoppingBag className="w-3.5 h-3.5" /></button>}
                                                            <button onClick={() => handleStartEdit(p)} className="bg-amber-50 text-amber-600 hover:bg-amber-100 p-1.5 rounded-full transition cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                                                            <button onClick={() => handleDeleteProduct(p.productId)} className="bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded-full transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ═══ TAB 2: CLIENTES DO ESTOQUE ══════════════════════════════════ */}
                {activeTab === 'customers' && (
                    <div className="space-y-5">
                        {/* Sub-tab nav */}
                        <div className="flex gap-6 border-b border-slate-200 pb-3">
                            {[['list', 'Lista de Clientes'], ['raffle', 'Sorteador de Brindes 🎲']].map(([t, l]) => (
                                <button key={t} onClick={() => setCustomersSubTab(t as any)}
                                    className={`text-xs font-bold pb-1 cursor-pointer transition ${customersSubTab === t ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-400 hover:text-slate-700'}`}>
                                    {l}
                                </button>
                            ))}
                        </div>

                        {customersSubTab === 'list' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Add customer form */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm h-fit">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                        <PlusCircle className="w-4 h-4 text-emerald-600" /> Cadastrar Cliente
                                    </h3>
                                    <form onSubmit={handleAddCustomer} className="space-y-3">
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Nome Completo</label>
                                            <input type="text" placeholder="Ex: João Silva" value={newCustName} onChange={e => setNewCustName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs h-9" required />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">WhatsApp</label>
                                            <input type="text" placeholder="(11) 99999-9999" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs h-9" />
                                        </div>
                                        <button type="submit" disabled={custLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition text-xs cursor-pointer disabled:opacity-50">
                                            {custLoading ? 'Salvando...' : 'Cadastrar Cliente'}
                                        </button>
                                    </form>
                                </div>

                                {/* Customer list */}
                                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800">Clientes Cadastrados</h3>
                                            <p className="text-[10px] text-slate-400">{inventoryCustomers.length} cliente(s) · somente do Estoque Inteligente</p>
                                        </div>
                                        <div className="relative w-full sm:w-48">
                                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                            <input type="text" placeholder="Buscar..." value={customerSearchQuery} onChange={e => setCustomerSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 text-xs" />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="text-slate-400 text-[10px] border-b border-slate-100 font-bold uppercase tracking-wide">
                                                    <th className="pb-3 px-2">Cliente</th>
                                                    <th className="pb-3 px-2">WhatsApp</th>
                                                    <th className="pb-3 px-2">Dívida Ativa</th>
                                                    <th className="pb-3 px-2 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCustomers.length === 0 ? (
                                                    <tr><td colSpan={4} className="py-8 text-center text-slate-400 italic">Nenhum cliente cadastrado no estoque.</td></tr>
                                                ) : filteredCustomers.map(c => {
                                                    const owed = debtsByCustomer[c.customerId] || 0;
                                                    return (
                                                        <tr key={c.customerId} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                            <td className="py-3 px-2 font-bold text-slate-900">{c.name}</td>
                                                            <td className="py-3 px-2 text-slate-500 text-xs">{c.phone || '-'}</td>
                                                            <td className="py-3 px-2">
                                                                {owed > 0 ? (
                                                                    <span className="bg-red-50 text-red-700 border border-red-100 font-bold px-2.5 py-0.5 rounded-full text-[10px]">R$ {owed.toFixed(2)}</span>
                                                                ) : (
                                                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2.5 py-0.5 rounded-full text-[10px]">Sem Pendências</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-2 text-right">
                                                                <div className="flex gap-1.5 justify-end">
                                                                    {/* Ver histórico e pagar */}
                                                                    <button onClick={() => { handleCancelEditDebt(); setDetailsCustomerId(c.customerId); setShowDetailsModal(true); }}
                                                                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded-full transition cursor-pointer" title="Ver Histórico / Pagar Dívida">
                                                                        <Eye className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    {/* Registrar compra */}
                                                                    <button onClick={() => openSaleFromCustomer(c.customerId)}
                                                                        className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-full transition cursor-pointer" title="Registrar Compra">
                                                                        <ShoppingBag className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    {/* WhatsApp cobrança */}
                                                                    {c.phone && owed > 0 && (
                                                                        <a href={getWhatsappLink(c.phone, c.name, owed, storeSettings?.whatsappMessage)} target="_blank" rel="noreferrer"
                                                                            className="bg-green-50 text-green-600 hover:bg-green-100 p-1.5 rounded-full transition cursor-pointer" title="Cobrar via WhatsApp">
                                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Raffle sub-tab */}
                        {customersSubTab === 'raffle' && (
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/60 max-w-lg mx-auto text-center">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 mx-auto border border-emerald-100">
                                    <Award className="w-7 h-7" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">Sorteador de Clientes 🎉</h2>
                                <p className="text-slate-500 mb-6 text-xs leading-relaxed">Sorteie um dos seus clientes do estoque. Ótimo para campanhas e brindes!</p>
                                {inventoryCustomers.length === 0 ? (
                                    <p className="text-slate-400 italic text-sm">Nenhum cliente cadastrado no estoque para sorteio.</p>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="h-28 bg-slate-50 rounded-2xl border border-slate-200/50 flex flex-col items-center justify-center relative overflow-hidden">
                                            <div className="absolute top-2 left-2 text-[8px] uppercase font-bold text-slate-400 tracking-wider">Urna Digital</div>
                                            {isDrawing ? (
                                                <p className="text-xl font-black text-emerald-600 animate-pulse">{drawName}</p>
                                            ) : winner ? (
                                                <div>
                                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold mb-1">
                                                        <Sparkles className="w-3 h-3" /> Sorteado Vencedor!
                                                    </div>
                                                    <p className="text-xl font-black text-slate-900">{winner.name}</p>
                                                    {winner.phone && <p className="text-[10px] text-slate-500 mt-1">📱 {winner.phone}</p>}
                                                </div>
                                            ) : <p className="text-slate-400 italic text-sm">Aguardando início do sorteio...</p>}
                                        </div>
                                        <button onClick={handleDrawWinner} disabled={isDrawing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-8 rounded-xl transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-md">
                                            {isDrawing ? 'Sorteando...' : 'Realizar Sorteio 🎲'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ TAB 3: ANÁLISE DE VENDAS ════════════════════════════════════ */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* Top stat bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            {[
                                { label: 'Total de Clientes (Estoque)', value: inventoryCustomers.length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                                { label: 'Faturado no Mês (Estoque)', value: `R$ ${thisMonthSold.toFixed(2)}`, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                                { label: 'Recebido no Mês (Pagas/À Vista)', value: `R$ ${thisMonthPaid.toFixed(2)}`, color: 'bg-amber-50 text-amber-700 border-amber-100' },
                            ].map(s => (
                                <div key={s.label} className={`p-4 rounded-2xl border font-sans ${s.color}`}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{s.label}</p>
                                    <h3 className="text-2xl font-black mt-1">{s.value}</h3>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Items ranking */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">🏆 Itens Mais Vendidos (Mês)</h3>
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {sortedSales.length === 0 ? <p className="text-slate-400 italic text-xs py-4">Nenhuma venda este mês.</p> :
                                        sortedSales.map((s, i) => (
                                            <div key={i} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center font-bold text-[9px]">{i + 1}</span>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{s.name}</p>
                                                        <p className="text-[9px] text-slate-400">{s.qty} unid.</p>
                                                    </div>
                                                </div>
                                                <span className="font-black text-slate-900">R$ {s.value.toFixed(2)}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Debtors */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">⚠️ Quem Está Devendo</h3>
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {debtorsList.length === 0 ? <p className="text-slate-400 italic text-xs py-4">Nenhum fiado pendente.</p> :
                                        debtorsList.map((d, i) => (
                                            <div key={d.customerId} className="flex justify-between items-center bg-red-50/50 p-2.5 rounded-xl border border-red-100/50 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-[9px]">{i + 1}</span>
                                                    <p className="font-bold text-slate-800">{d.name || 'Desconhecido'}</p>
                                                </div>
                                                <span className="font-black text-red-600">R$ {d.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Top buyers */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">🥇 Quem Comprou Mais</h3>
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {topBuyers.length === 0 ? <p className="text-slate-400 italic text-xs py-4">Nenhum registro de compras.</p> :
                                        topBuyers.map((b, i) => (
                                            <div key={b.customerId} className="flex justify-between items-center bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-[9px]">{i + 1}</span>
                                                    <p className="font-bold text-slate-800">{b.name || 'Desconhecido'}</p>
                                                </div>
                                                <span className="font-black text-emerald-700">R$ {b.total.toFixed(2)}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ SALE MODAL ══════════════════════════════════════════════════════ */}
            {showSaleModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <ShoppingBag className="w-4 h-4 text-emerald-600" /> Registrar Venda / Compra
                            </h3>
                            <button onClick={() => setShowSaleModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleRegisterSale} className="p-6 space-y-4 text-xs">

                            {/* Customer section */}
                            {modalCustomerId ? (
                                <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl">
                                    <span className="text-[9px] font-bold text-emerald-600 uppercase block mb-0.5">Cliente Selecionado</span>
                                    <span className="font-black text-emerald-900">{inventoryCustomers.find(c => c.customerId === modalCustomerId)?.name}</span>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                                        <span className="font-bold text-slate-600 text-[9px] uppercase">Cliente Comprador</span>
                                        <label className="flex items-center gap-1 font-bold text-emerald-600 text-[9px] cursor-pointer">
                                            <input type="checkbox" checked={modalIsNew} onChange={e => setModalIsNew(e.target.checked)} className="rounded w-3 h-3" /> Novo cliente
                                        </label>
                                    </div>
                                    {modalIsNew ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Nome *</label>
                                                <input type="text" placeholder="Nome" value={modalNewName} onChange={e => setModalNewName(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs h-8" required />
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">WhatsApp</label>
                                                <input type="text" placeholder="WhatsApp" value={modalNewPhone} onChange={e => setModalNewPhone(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs h-8" />
                                            </div>
                                        </div>
                                    ) : (
                                        <select value={modalCustomerId} onChange={e => setModalCustomerId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white h-9" required>
                                            <option value="">Selecione o cliente...</option>
                                            {inventoryCustomers.map(c => <option key={c.customerId} value={c.customerId}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Product section */}
                            {modalProductId ? (
                                <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl flex justify-between items-center">
                                    <div>
                                        <span className="text-[9px] font-bold text-blue-600 uppercase block mb-0.5">Produto Selecionado</span>
                                        <span className="font-black text-blue-900">{targetProduct?.name}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold">{targetProduct?.quantity} em estoque</span>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Selecione o Produto</label>
                                    <select value={modalProductId} onChange={e => setModalProductId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white h-9" required>
                                        <option value="">Selecione um produto...</option>
                                        {products.map(p => <option key={p.productId} value={p.productId}>{p.name} — R$ {p.price.toFixed(2)} ({p.quantity} disp.){p.quantity === 0 ? ' (SEM ESTOQUE)' : ''}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Qty & Due Date */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Quantidade</label>
                                    <input type="number" min="1" max={targetProduct?.quantity || 999} value={modalQty} onChange={e => setModalQty(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9" required disabled={!modalProductId} />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Vencimento</label>
                                    <input type="date" value={modalDueDate} onChange={e => setModalDueDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9 bg-white" />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Descrição</label>
                                <input type="text" value={modalDesc} onChange={e => setModalDesc(e.target.value)} placeholder="Descrição da compra" className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-9" disabled={!modalProductId} />
                            </div>

                            {/* Total */}
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/50 flex justify-between items-center">
                                <span className="font-bold text-slate-600">Valor Total:</span>
                                <span className="font-black text-lg text-slate-900">
                                    R$ {targetProduct ? (targetProduct.price * Number(modalQty || 0)).toFixed(2) : '0.00'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button type="submit" disabled={saleLoading || !modalProductId || (!modalCustomerId && !modalIsNew)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50 shadow-md">
                                    {saleLoading ? 'Registrando...' : 'Confirmar Venda'}
                                </button>
                                <button type="button" onClick={() => setShowSaleModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 px-5 rounded-xl font-bold transition cursor-pointer border border-slate-200">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ CUSTOMER DETAILS MODAL ══════════════════════════════════════════ */}
            {showDetailsModal && detailsCustomer && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-start px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                            <div>
                                <h3 className="text-sm font-black text-slate-900">{detailsCustomer.name}</h3>
                                <p className="text-[10px] text-slate-500">{detailsCustomer.phone || 'Sem telefone'} · Histórico do Estoque</p>
                            </div>
                            <button onClick={() => { setShowDetailsModal(false); handleCancelEditDebt(); }} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-3 p-5 border-b border-slate-100 shrink-0">
                            <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
                                <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider">Total Devido (Pendente)</p>
                                <h4 className="text-xl font-black text-red-700">R$ {detailsTotalOwed.toFixed(2)}</h4>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Comprado (Geral)</p>
                                <h4 className="text-xl font-black text-slate-800">R$ {detailsTotalSpent.toFixed(2)}</h4>
                            </div>
                        </div>

                        {/* Pay all button */}
                        {detailsTotalOwed > 0 && (
                            <div className="px-5 pt-4 shrink-0">
                                <button onClick={() => { handlePayAllDebts(detailsCustomer.customerId); }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md text-sm">
                                    <CheckCircle2 className="w-4 h-4" /> Quitar Todas as Dívidas (R$ {detailsTotalOwed.toFixed(2)})
                                </button>
                            </div>
                        )}

                        {/* Purchases list */}
                        <div className="flex-1 overflow-y-auto p-5">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Histórico de Compras</h4>
                            {detailsDebts.length === 0 ? (
                                <p className="text-slate-400 italic text-sm text-center py-8">Nenhuma compra registrada.</p>
                            ) : (
                                <div className="space-y-2">
                                    {detailsDebts.map(d => (
                                        <div key={d.debtId} className={`p-3 rounded-xl border text-xs ${d.status === 'Paga' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-orange-50/50 border-orange-100'}`}>
                                            {editDebtId === d.debtId ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="flex gap-2">
                                                            <input type="number" step="0.01" min="0.01"
                                                                value={editDebtValue}
                                                                onChange={e => setEditDebtValue(e.target.value === '' ? '' : Number(e.target.value))}
                                                                className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs"
                                                                placeholder="Valor" />
                                                            <span className="font-black text-slate-900 self-center">
                                                                R$ {Number(editDebtValue || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <input type="text" value={editDebtDesc}
                                                            onChange={e => setEditDebtDesc(e.target.value)}
                                                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                                                            placeholder="Descrição" />
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button onClick={handleSaveEditDebt}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer text-[9px]">
                                                            Salvar
                                                        </button>
                                                        <button onClick={handleCancelEditDebt}
                                                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer text-[9px]">
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-center gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-800 truncate">{d.description || 'Compra sem descrição'}</p>
                                                        <p className="text-[9px] text-slate-400 mt-0.5">
                                                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-BR') : d.dueDate}
                                                            {d.status === 'Pendente' && ` · Vence: ${new Date(d.dueDate).toLocaleDateString('pt-BR')}`}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button onClick={() => handleStartEditDebt(d)}
                                                            className="bg-amber-50 text-amber-600 p-1.5 rounded-full hover:bg-amber-100 transition cursor-pointer"
                                                            title="Editar valor / descrição">
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                        <span className="font-black text-slate-900">R$ {Number(d.value).toFixed(2)}</span>
                                                        {d.status === 'Paga' ? (
                                                            <button onClick={() => handleRevertDebt(d.debtId)}
                                                                className="bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full text-[9px] hover:bg-orange-200 transition cursor-pointer whitespace-nowrap">
                                                                Reverter
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handlePayDebt(d.debtId)}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg transition cursor-pointer text-[9px] flex items-center gap-1 whitespace-nowrap">
                                                                <DollarSign className="w-3 h-3" /> Pagar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                message="Você atingiu o limite do plano gratuito. Faça upgrade para o PRO e tenha cadastros ilimitados!"
            />
        </Layout>
    );
}
