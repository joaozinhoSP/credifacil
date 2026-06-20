import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, DocumentData, limit } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '../context/AuthContext';
import { Customer, Debt, Product } from '../types';
import { updateCache, readCache } from './utils';

function useCollection<T extends DocumentData>(
    storeId: string | undefined,
    collectionName: string,
    cacheKey: string,
    idField: string
) {
    const [data, setData] = useState<T[]>(() => {
        return readCache<T[]>(storeId, cacheKey) || [];
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!storeId) return;

        setLoading(true);
        setError(null);

        const cached = readCache<T[]>(storeId, cacheKey);
        if (cached) setData(cached);

        const handleCacheUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.key === cacheKey) {
                setData(customEvent.detail.data);
            }
        };

        const handleStorageSync = () => {
            const cached = readCache<T[]>(storeId, cacheKey);
            if (cached) setData(cached);
        };

        window.addEventListener('cache-update', handleCacheUpdate as EventListener);
        window.addEventListener('storage', handleStorageSync);

        const q = query(
            collection(db, 'stores', storeId, collectionName),
            limit(200)
        );
        let hasReceivedData = false;

        const unsub = onSnapshot(q,
            (snapshot) => {
                const mapped = snapshot.docs.map(doc => ({ ...doc.data() as T, [idField]: doc.id }));
                if (mapped.length === 0 && hasReceivedData) {
                    const cached = readCache<T[]>(storeId, cacheKey);
                    if (cached && cached.length > 0) return;
                }
                hasReceivedData = true;
                setData(mapped);
                setLoading(false);
                updateCache(storeId, cacheKey, mapped);
            },
            (err: Error) => {
                console.error(`Erro ao carregar ${collectionName}:`, err);
                setError(err.message || 'Erro de conexão');
                setLoading(false);
            }
        );

        return () => {
            window.removeEventListener('cache-update', handleCacheUpdate as EventListener);
            window.removeEventListener('storage', handleStorageSync);
            unsub();
        };
    }, [storeId, collectionName, cacheKey, idField]);

    return { data, loading, error };
}

export function useStoreData() {
    const { user } = useAuth();
    const storeId = user?.uid;
    const isDev = import.meta.env.DEV;

    const customers = useCollection<Customer>(storeId, 'customers', 'customers', 'customerId');
    const debts = useCollection<Debt>(storeId, 'debts', 'debts', 'debtId');
    const inventoryCustomers = useCollection<Customer>(storeId, 'inventory_customers', 'inventory_customers', 'customerId');
    const inventoryDebts = useCollection<Debt>(storeId, 'inventory_debts', 'inventory_debts', 'debtId');
    const products = useCollection<Product>(storeId, 'products', 'products', 'productId');

    const [storeInfo, setStoreInfo] = useState<{ name?: string; ownerName?: string; email?: string; subscriptionStatus?: 'free' | 'pro'; settings?: { defaultCreditLimit?: number; whatsappMessage?: string } }>(() => {
        const cached = readCache<typeof storeInfo>(storeId, 'store_info');
        if (cached) {
            if (isDev) cached.subscriptionStatus = 'pro';
            return cached;
        }
        return isDev ? { subscriptionStatus: 'pro' as const } : {};
    });
    const [storeInfoLoading, setStoreInfoLoading] = useState(true);
    const [storeInfoError, setStoreInfoError] = useState<string | null>(null);

    const [storeSettings, setStoreSettings] = useState<{ defaultCreditLimit?: number; whatsappMessage?: string }>(() => {
        return readCache<typeof storeSettings>(storeId, 'settings') || {};
    });

    useEffect(() => {
        if (!storeId) return;

        setStoreInfoLoading(true);
        setStoreInfoError(null);

        const cached = readCache<typeof storeInfo>(storeId, 'store_info');
        if (cached) {
            if (isDev) cached.subscriptionStatus = 'pro';
            setStoreInfo(cached);
        } else if (isDev) {
            setStoreInfo({ subscriptionStatus: 'pro' });
        }
        const cachedS = readCache<typeof storeSettings>(storeId, 'settings');
        if (cachedS) setStoreSettings(cachedS);

        const handleStorageSync = () => {
            const cInfo = readCache<typeof storeInfo>(storeId, 'store_info');
            if (cInfo) {
                if (isDev) cInfo.subscriptionStatus = 'pro';
                setStoreInfo(cInfo);
            } else if (isDev) {
                setStoreInfo({ subscriptionStatus: 'pro' });
            }
            const cSets = readCache<typeof storeSettings>(storeId, 'settings');
            if (cSets) setStoreSettings(cSets);
        };

        const handleCacheUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail) {
                const { key, data } = customEvent.detail;
                if (key === 'store_info') setStoreInfo(data);
                if (key === 'settings') setStoreSettings(data);
            }
        };

        window.addEventListener('cache-update', handleCacheUpdate as EventListener);
        window.addEventListener('storage', handleStorageSync);

        const storeRef = doc(db, 'stores', storeId);
        const unsubStore = onSnapshot(storeRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    const settings = data.settings || {};

                    if (user && (!data.email || !data.subscriptionStatus)) {
                        updateDoc(storeRef, {
                            email: user.email?.trim().toLowerCase() || '',
                            subscriptionStatus: data.subscriptionStatus || 'free'
                        }).catch(err => console.error("Erro ao auto-atualizar dados da loja:", err));
                    }

                    const info = {
                        name: data.name || '',
                        ownerName: data.ownerName || '',
                        email: data.email || user?.email || '',
                        subscriptionStatus: isDev ? 'pro' : (data.subscriptionStatus || 'free'),
                        settings: settings
                    };
                    setStoreSettings(settings);
                    setStoreInfo(info);
                    setStoreInfoLoading(false);
                    updateCache(storeId, 'settings', settings as any);
                    localStorage.setItem(`cache_store_info_${storeId}`, JSON.stringify(info));
                } else {
                    setStoreInfoLoading(false);
                }
            },
            (err) => {
                console.error("Erro ao carregar configurações da loja:", err);
                setStoreInfoError(err.message || 'Erro ao carregar loja');
                setStoreInfoLoading(false);
            }
        );

        return () => {
            window.removeEventListener('storage', handleStorageSync);
            window.removeEventListener('cache-update', handleCacheUpdate as EventListener);
            unsubStore();
        };
    }, [storeId, user, isDev]);

    return {
        customers: customers.data,
        customersLoading: customers.loading,
        customersError: customers.error,
        debts: debts.data,
        debtsLoading: debts.loading,
        debtsError: debts.error,
        inventoryCustomers: inventoryCustomers.data,
        inventoryCustomersLoading: inventoryCustomers.loading,
        inventoryCustomersError: inventoryCustomers.error,
        inventoryDebts: inventoryDebts.data,
        inventoryDebtsLoading: inventoryDebts.loading,
        inventoryDebtsError: inventoryDebts.error,
        products: products.data,
        productsLoading: products.loading,
        productsError: products.error,
        storeSettings,
        storeInfo,
        storeInfoLoading,
        storeInfoError,
    };
}
