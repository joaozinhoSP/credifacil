import { Debt, Customer } from '../types';

export function getWhatsappLink(phone: string, name: string, value: number, template?: string) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return '#';
    let message = template || "Olá {cliente}! Lembrete de sua dívida no valor de R$ {valor}.";
    message = message.replace(/{cliente}/g, name).replace(/{valor}/g, value.toFixed(2));
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function getMessagePreview(name: string, value: number, template?: string, isPro?: boolean) {
    let tpl = template || "Olá {cliente}! Lembrete de sua dívida no valor de R$ {valor}.";
    if (!isPro) tpl = "Olá {cliente}! Lembrete de sua dívida no valor de R$ {valor}.";
    return tpl.replace(/{cliente}/g, name).replace(/{valor}/g, value.toFixed(2));
}

export function aggregateDebtsByCustomer(debts: Debt[]) {
    return debts.reduce((acc, d) => {
        acc[d.customerId] = (acc[d.customerId] || 0) + Number(d.value);
        return acc;
    }, {} as Record<string, number>);
}

export function lastChargedByCustomer(debts: Debt[]) {
    return debts.reduce((acc, d) => {
        if (d.lastChargedAt) {
            const date = new Date(d.lastChargedAt);
            if (!acc[d.customerId] || date > new Date(acc[d.customerId])) {
                acc[d.customerId] = d.lastChargedAt;
            }
        }
        return acc;
    }, {} as Record<string, string>);
}

export function updateCache(uid: string, key: string, data: any[]) {
    localStorage.setItem(`cache_${key}_${uid}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('cache-update', { detail: { key, data } }));
    window.dispatchEvent(new Event('storage'));
}

export function readCache<T>(uid: string | null, key: string): T | null {
    if (!uid) return null;
    const cached = localStorage.getItem(`cache_${key}_${uid}`);
    return cached ? JSON.parse(cached) : null;
}

export function formatDate(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
}

export function clearCache(uid: string) {
    const keys = [
        `cache_customers_${uid}`,
        `cache_debts_${uid}`,
        `cache_inventory_customers_${uid}`,
        `cache_inventory_debts_${uid}`,
        `cache_products_${uid}`,
        `cache_store_info_${uid}`,
        `cache_settings_${uid}`,
    ];
    keys.forEach(k => localStorage.removeItem(k));
    window.dispatchEvent(new Event('storage'));
}
