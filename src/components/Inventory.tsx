import React, { useState, useRef } from 'react';
import { collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import { useStoreData } from '../lib/hooks';
import { Pencil, Trash2, X, Plus, Minus, Search, ArrowUpDown, Package, Image as ImageIcon } from 'lucide-react';
import { Product } from '../types';
import UpgradeModal from './UpgradeModal';

export default function Inventory() {
    const { user } = useAuth();
    const { products = [], storeInfo } = useStoreData();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState<number | ''>('');
    const [price, setPrice] = useState<number | ''>('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Filters and Sorting States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'price' | 'totalValue'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Compress & Convert image to Base64 (resizes to max 150x150 for Firestore efficiency)
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 150;
                const MAX_HEIGHT = 150;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Compress quality to 0.7 to keep it extremely lightweight (usually < 10KB)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setImageUrl(dataUrl);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name || quantity === '' || price === '') return;

        const isPro = storeInfo?.subscriptionStatus === 'pro';
        if (!isPro && products.length >= 10 && !editingProduct) {
            setShowUpgradeModal(true);
            return;
        }

        try {
            if (editingProduct) {
                // Edit mode
                const productRef = doc(db, 'stores', user.uid, 'products', editingProduct.productId);
                await updateDoc(productRef, {
                    name,
                    quantity: Number(quantity),
                    price: Number(price),
                    imageUrl
                });
                alert('Produto atualizado com sucesso!');
                setEditingProduct(null);
            } else {
                // Add mode
                const productRef = doc(collection(db, 'stores', user.uid, 'products'));
                await setDoc(productRef, {
                    productId: productRef.id,
                    storeId: user.uid,
                    name,
                    quantity: Number(quantity),
                    price: Number(price),
                    imageUrl,
                    createdAt: new Date().toISOString()
                });
                alert('Produto adicionado ao estoque!');
            }
            // Clear form
            setName('');
            setQuantity('');
            setPrice('');
            setImageUrl('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert('Erro ao salvar as informações do produto.');
        }
    };

    const handleStartEdit = (product: Product) => {
        setEditingProduct(product);
        setName(product.name);
        setQuantity(product.quantity);
        setPrice(product.price);
        setImageUrl(product.imageUrl || '');
    };

    const handleCancelEdit = () => {
        setEditingProduct(null);
        setName('');
        setQuantity('');
        setPrice('');
        setImageUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!user) return;
        if (window.confirm('Tem certeza que deseja excluir este produto do estoque?')) {
            try {
                const productRef = doc(db, 'stores', user.uid, 'products', productId);
                await deleteDoc(productRef);
                alert('Produto removido do estoque.');
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                alert('Erro ao excluir o produto.');
            }
        }
    };

    const handleAdjustQuantity = async (productId: string, currentQty: number, delta: number) => {
        if (!user) return;
        const newQty = Math.max(0, currentQty + delta);
        try {
            const productRef = doc(db, 'stores', user.uid, 'products', productId);
            await updateDoc(productRef, { quantity: newQty });
        } catch (error) {
            console.error('Erro ao ajustar quantidade:', error);
        }
    };

    const toggleSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Summary calculations
    const totalProducts = products.length;
    const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalStockValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity < 5).length;
    const outOfStockCount = products.filter(p => p.quantity === 0).length;
    const alertCount = lowStockCount + outOfStockCount;

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (statusFilter === 'in_stock') {
            return matchesSearch && p.quantity > 0;
        }
        if (statusFilter === 'low_stock') {
            return matchesSearch && p.quantity > 0 && p.quantity < 5;
        }
        if (statusFilter === 'out_of_stock') {
            return matchesSearch && p.quantity === 0;
        }
        return matchesSearch;
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        let fieldA: any = a[sortBy];
        let fieldB: any = b[sortBy];

        if (sortBy === 'totalValue') {
            fieldA = a.quantity * a.price;
            fieldB = b.quantity * b.price;
        }

        if (typeof fieldA === 'string') {
            return sortOrder === 'asc' 
                ? fieldA.localeCompare(fieldB) 
                : fieldB.localeCompare(fieldA);
        } else {
            return sortOrder === 'asc' 
                ? fieldA - fieldB 
                : fieldB - fieldA;
        }
    });

    return (
        <Layout>
            <h1 className="text-3xl font-bold mb-8 text-gray-800 font-sans flex items-center gap-3">
                <Package className="w-8 h-8 text-emerald-600" />
                Controle de Estoque
            </h1>

            {/* Dashboard Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 font-sans">
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center hover:scale-[1.02] transition-transform">
                    <div className="p-3 bg-emerald-100 rounded-full mr-4">
                        <Package className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total de Produtos</p>
                        <h3 className="text-3xl font-bold text-emerald-600">{totalProducts}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center hover:scale-[1.02] transition-transform">
                    <div className="p-3 bg-blue-100 rounded-full mr-4 font-bold text-blue-600 text-xl flex items-center justify-center w-14 h-14">
                        #
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Qtd. Total de Itens</p>
                        <h3 className="text-3xl font-bold text-blue-600">{totalItems}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center hover:scale-[1.02] transition-transform">
                    <div className="p-3 bg-amber-100 rounded-full mr-4 text-amber-600 text-xl flex items-center justify-center font-bold w-14 h-14">
                        R$
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Valor Total Estoque</p>
                        <h3 className="text-2xl font-bold text-amber-600">R$ {totalStockValue.toFixed(2)}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center hover:scale-[1.02] transition-transform">
                    <div className="p-3 bg-red-100 rounded-full mr-4 font-bold text-red-600 text-xl flex items-center justify-center w-14 h-14">
                        ⚠️
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Produtos em Alerta</p>
                        <h3 className="text-3xl font-bold text-red-600">{alertCount}</h3>
                    </div>
                </div>
            </div>

            {/* Product Form */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-8 font-sans">
                <h2 className="text-xl font-bold mb-5 text-gray-800 flex items-center gap-2">
                    {editingProduct ? 'Editar Produto no Estoque' : 'Cadastrar Novo Produto'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    {/* Foto Upload */}
                    <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors h-28 relative">
                        {imageUrl ? (
                            <>
                                <img src={imageUrl} alt="Preview" className="h-full object-contain rounded-md" />
                                <button 
                                    type="button" 
                                    onClick={() => setImageUrl('')} 
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </>
                        ) : (
                            <label className="flex flex-col items-center cursor-pointer justify-center text-gray-500 hover:text-emerald-600 transition w-full h-full">
                                <ImageIcon className="w-8 h-8 mb-1" />
                                <span className="text-xs font-semibold">Adicionar Foto</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageChange} 
                                    className="hidden" 
                                    ref={fileInputRef}
                                />
                            </label>
                        )}
                    </div>

                    {/* Nome */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Nome do Produto</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Coca-Cola 2L, Camiseta Polo M" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 h-11" 
                            required 
                        />
                    </div>

                    {/* Quantidade */}
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Quantidade Inicial</label>
                        <input 
                            type="number" 
                            placeholder="Ex: 50" 
                            value={quantity} 
                            onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 h-11" 
                            required 
                            min="0"
                        />
                    </div>

                    {/* Preço Unitário */}
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Preço Unitário (R$)</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            placeholder="Ex: 8.50" 
                            value={price} 
                            onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 h-11" 
                            required 
                            min="0"
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="md:col-span-2 flex gap-3 h-11">
                        <button 
                            type="submit" 
                            className="flex-1 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 transition cursor-pointer flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            {editingProduct ? 'Salvar Alterações' : 'Adicionar ao Estoque'}
                        </button>
                        {editingProduct && (
                            <button 
                                type="button" 
                                onClick={handleCancelEdit}
                                className="bg-gray-100 text-gray-600 px-4 rounded-md font-semibold hover:bg-gray-200 transition cursor-pointer flex items-center justify-center"
                                title="Cancelar edição"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {/* List and Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 font-sans">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Itens em Estoque</h2>
                    
                    {/* Filters bar */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                            <input 
                                type="text" 
                                placeholder="Buscar produto..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 h-10"
                            />
                        </div>

                        {/* Status Filter */}
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 h-10 bg-white"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="in_stock">Em Estoque</option>
                            <option value="low_stock">Estoque Baixo (&lt; 5)</option>
                            <option value="out_of_stock">Sem Estoque (0)</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-400 text-sm border-b border-gray-100">
                                <th className="pb-3 px-3 w-16">Foto</th>
                                <th className="pb-3 px-3 cursor-pointer select-none hover:text-gray-600" onClick={() => toggleSort('name')}>
                                    <div className="flex items-center gap-1">
                                        Produto <ArrowUpDown className="w-3.5 h-3.5" />
                                    </div>
                                </th>
                                <th className="pb-3 px-3 cursor-pointer select-none hover:text-gray-600" onClick={() => toggleSort('quantity')}>
                                    <div className="flex items-center gap-1">
                                        Qtd. Estoque <ArrowUpDown className="w-3.5 h-3.5" />
                                    </div>
                                </th>
                                <th className="pb-3 px-3 text-center w-28">Ajuste Rápido</th>
                                <th className="pb-3 px-3 cursor-pointer select-none hover:text-gray-600" onClick={() => toggleSort('price')}>
                                    <div className="flex items-center gap-1">
                                        Preço Unitário <ArrowUpDown className="w-3.5 h-3.5" />
                                    </div>
                                </th>
                                <th className="pb-3 px-3 cursor-pointer select-none hover:text-gray-600" onClick={() => toggleSort('totalValue')}>
                                    <div className="flex items-center gap-1">
                                        Valor Total <ArrowUpDown className="w-3.5 h-3.5" />
                                    </div>
                                </th>
                                <th className="pb-3 px-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-gray-500">Nenhum produto encontrado.</td>
                                </tr>
                            ) : (
                                sortedProducts.map(p => {
                                    const totalVal = p.quantity * p.price;
                                    
                                    // Stock status badge formatting
                                    let badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                                    let badgeLabel = 'Em Estoque';
                                    if (p.quantity === 0) {
                                        badgeColor = 'bg-red-50 text-red-700 border border-red-200 animate-pulse';
                                        badgeLabel = 'Sem Estoque';
                                    } else if (p.quantity < 5) {
                                        badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200';
                                        badgeLabel = 'Estoque Baixo';
                                    }

                                    return (
                                        <tr key={p.productId} className="border-t border-gray-150 hover:bg-gray-50 transition-colors group">
                                            {/* Photo */}
                                            <td className="py-3 px-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden">
                                                    {p.imageUrl ? (
                                                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-200" />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                            </td>

                                            {/* Name */}
                                            <td className="py-3 px-3 text-gray-800 font-semibold truncate max-w-[220px]">
                                                {p.name}
                                            </td>

                                            {/* Quantity + Badge */}
                                            <td className="py-3 px-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-gray-700">{p.quantity} unid.</span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full w-max ${badgeColor}`}>
                                                        {badgeLabel}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Quick Adjust */}
                                            <td className="py-3 px-3 text-center">
                                                <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white">
                                                    <button 
                                                        onClick={() => handleAdjustQuantity(p.productId, p.quantity, -1)}
                                                        disabled={p.quantity <= 0}
                                                        className="p-1.5 hover:bg-gray-100 transition active:bg-gray-200 text-gray-500 disabled:opacity-50 cursor-pointer border-r border-gray-300"
                                                        title="Diminuir 1"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAdjustQuantity(p.productId, p.quantity, 1)}
                                                        className="p-1.5 hover:bg-gray-100 transition active:bg-gray-200 text-gray-500 cursor-pointer"
                                                        title="Aumentar 1"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Price */}
                                            <td className="py-3 px-3 text-gray-600 font-medium">
                                                R$ {p.price.toFixed(2)}
                                            </td>

                                            {/* Total Stock Value */}
                                            <td className="py-3 px-3 text-gray-900 font-bold">
                                                R$ {totalVal.toFixed(2)}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-3 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button 
                                                        onClick={() => handleStartEdit(p)} 
                                                        className="bg-amber-50 text-amber-600 p-1.5 rounded-full hover:bg-amber-100 transition-colors flex items-center justify-center cursor-pointer"
                                                        title="Editar Produto"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteProduct(p.productId)} 
                                                        className="bg-red-50 text-red-600 p-1.5 rounded-full hover:bg-red-100 transition-colors flex items-center justify-center cursor-pointer"
                                                        title="Excluir Produto"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)} 
                message="Você atingiu o limite de 10 produtos cadastrados no plano gratuito. Faça o upgrade para o plano PRO para ter estoques ilimitados!"
            />
        </Layout>
    );
}
