import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '../context/AuthContext';
import { Customer, Debt, Product } from '../types';

export function useStoreData() {
    const { user } = useAuth();
    const lastActiveUid = localStorage.getItem('auth_last_user_uid');

    const [customers, setCustomers] = useState<Customer[]>(() => {
        const uid = user?.uid || lastActiveUid;
        if (uid) {
            const cached = localStorage.getItem(`cache_customers_${uid}`);
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });
    const [debts, setDebts] = useState<Debt[]>(() => {
        const uid = user?.uid || lastActiveUid;
        if (uid) {
            const cached = localStorage.getItem(`cache_debts_${uid}`);
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });
    const [products, setProducts] = useState<Product[]>(() => {
        const uid = user?.uid || lastActiveUid;
        if (uid) {
            const cached = localStorage.getItem(`cache_products_${uid}`);
            return cached ? JSON.parse(cached) : [];
        }
        return [];
    });
    const [storeInfo, setStoreInfo] = useState<{ name?: string; ownerName?: string; email?: string; subscriptionStatus?: 'free' | 'pro'; settings?: { defaultCreditLimit?: number; whatsappMessage?: string } }>(() => {
        const uid = user?.uid || lastActiveUid;
        if (uid) {
            const cached = localStorage.getItem(`cache_store_info_${uid}`);
            return cached ? JSON.parse(cached) : {};
        }
        return {};
    });
    const [storeSettings, setStoreSettings] = useState<{ defaultCreditLimit?: number; whatsappMessage?: string }>(() => {
        const uid = user?.uid || lastActiveUid;
        if (uid) {
            const cached = localStorage.getItem(`cache_settings_${uid}`);
            return cached ? JSON.parse(cached) : {};
        }
        return {};
    });

    useEffect(() => {
        if (!user) return;

        const storeId = user.uid;

        // Sync initial state from cache
        const cachedCust = localStorage.getItem(`cache_customers_${storeId}`);
        if (cachedCust) setCustomers(JSON.parse(cachedCust));

        const cachedDebts = localStorage.getItem(`cache_debts_${storeId}`);
        if (cachedDebts) setDebts(JSON.parse(cachedDebts));

        const cachedProducts = localStorage.getItem(`cache_products_${storeId}`);
        if (cachedProducts) setProducts(JSON.parse(cachedProducts));

        const cachedSettings = localStorage.getItem(`cache_settings_${storeId}`);
        if (cachedSettings) setStoreSettings(JSON.parse(cachedSettings));

        const cachedStoreInfo = localStorage.getItem(`cache_store_info_${storeId}`);
        if (cachedStoreInfo) setStoreInfo(JSON.parse(cachedStoreInfo));

        // Sync changes from localStorage when triggered locally
        const handleStorageSync = () => {
            const cCust = localStorage.getItem(`cache_customers_${storeId}`);
            if (cCust) setCustomers(JSON.parse(cCust));

            const cDebts = localStorage.getItem(`cache_debts_${storeId}`);
            if (cDebts) setDebts(JSON.parse(cDebts));

            const cProducts = localStorage.getItem(`cache_products_${storeId}`);
            if (cProducts) setProducts(JSON.parse(cProducts));

            const cSettings = localStorage.getItem(`cache_settings_${storeId}`);
            if (cSettings) setStoreSettings(JSON.parse(cSettings));

            const cStoreInfo = localStorage.getItem(`cache_store_info_${storeId}`);
            if (cStoreInfo) setStoreInfo(JSON.parse(cStoreInfo));
        };

        window.addEventListener('storage', handleStorageSync);

        // Subscriptions
        const customersQuery = query(collection(db, 'stores', storeId, 'customers'));
        const debtsQuery = query(collection(db, 'stores', storeId, 'debts'));
        const productsQuery = query(collection(db, 'stores', storeId, 'products'));
        const storeRef = doc(db, 'stores', storeId);

        const unsubCustomers = onSnapshot(customersQuery, 
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data() as Customer, customerId: doc.id }));
                setCustomers(data);
                localStorage.setItem(`cache_customers_${storeId}`, JSON.stringify(data));
            },
            (error) => {
                console.error("Erro ao carregar clientes:", error);
            }
        );

        const unsubDebts = onSnapshot(debtsQuery, 
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data() as Debt, debtId: doc.id }));
                setDebts(data);
                localStorage.setItem(`cache_debts_${storeId}`, JSON.stringify(data));
            },
            (error) => {
                console.error("Erro ao carregar dívidas:", error);
            }
        );

        const unsubProducts = onSnapshot(productsQuery, 
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data() as Product, productId: doc.id }));
                setProducts(data);
                localStorage.setItem(`cache_products_${storeId}`, JSON.stringify(data));
            },
            (error) => {
                console.error("Erro ao carregar produtos:", error);
            }
        );

        const unsubStore = onSnapshot(storeRef, 
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    const settings = data.settings || {};
                    
                    // Auto-backfill email or subscriptionStatus if missing
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
                        subscriptionStatus: data.subscriptionStatus || 'free',
                        settings: settings
                    };
                    setStoreSettings(settings);
                    setStoreInfo(info);
                    localStorage.setItem(`cache_settings_${storeId}`, JSON.stringify(settings));
                    localStorage.setItem(`cache_store_info_${storeId}`, JSON.stringify(info));
                }
            },
            (error) => {
                console.error("Erro ao carregar configurações da loja:", error);
            }
        );

        return () => { 
            window.removeEventListener('storage', handleStorageSync);
            unsubCustomers(); 
            unsubDebts(); 
            unsubProducts();
            unsubStore(); 
        };
    }, [user]);

    return { customers, debts, products, storeSettings, storeInfo };
}
