export type Store = {
    storeId: string;
    name: string;
    cnpj?: string;
    ownerId: string;
    settings: {
        defaultCreditLimit?: number;
        whatsappMessage?: string;
    };
};

export type CustomerStatus = 'Ativo' | 'Inadimplente';

export type Customer = {
    customerId: string;
    storeId: string;
    name: string;
    phone: string;
    address?: string;
    createdAt: string;
    status: CustomerStatus;
};

export type DebtStatus = 'Pendente' | 'Paga';

export type Debt = {
    debtId: string;
    customerId: string;
    customerName?: string;
    storeId: string;
    value: number;
    description?: string;
    dueDate: string;
    status: DebtStatus;
    lastChargedAt?: string;
    createdAt?: string;
};

export type Payment = {
    paymentId: string;
    debtId: string;
    storeId: string;
    value: number;
    date: string;
    method: 'Dinheiro' | 'PIX' | 'Cartão';
};

export type Product = {
    productId: string;
    storeId: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string;
    createdAt: string;
};

