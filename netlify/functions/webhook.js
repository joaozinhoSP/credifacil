const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc } = require('firebase/firestore');

// Firebase config loaded from environment variables set in Netlify Dashboard
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const firestoreDatabaseId = process.env.FIREBASE_FIRESTORE_DB_ID || '(default)';

let app;
let db;

function getDb() {
    if (!db) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app, firestoreDatabaseId);
    }
    return db;
}

// Validate required environment variables on cold start
const REQUIRED_ENV = ['FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID'];
for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
        console.error(`Variável de ambiente ausente: ${key}`);
    }
}

exports.handler = async (event) => {
    // Only accept POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    // Verify webhook secret (set WEBHOOK_SECRET in Netlify Dashboard)
    const secret = process.env.WEBHOOK_SECRET;
    if (secret) {
        const headerSecret = event.headers['x-webhook-secret'] || event.headers['X-Webhook-Secret'] || '';
        if (headerSecret !== secret) {
            console.error('Webhook rejeitado: assinatura inválida.');
            return { statusCode: 401, body: JSON.stringify({ error: 'Assinatura inválida.' }) };
        }
    } else {
        console.warn('WEBHOOK_SECRET não configurado. Webhook sem proteção!');
    }

    console.log('--- Webhook Recebido da FortPay ---');

    try {
        const payload = JSON.parse(event.body || '{}');
        console.log('Payload:', JSON.stringify(payload, null, 2));

        // Extract email from multiple possible gateway payload formats
        const emailInput =
            payload?.email ||
            payload?.customer?.email ||
            payload?.payer?.email ||
            payload?.data?.customer?.email ||
            payload?.data?.email;

        // Extract status or event
        const statusInput =
            payload?.status ||
            payload?.data?.status ||
            payload?.event;

        if (!emailInput) {
            console.error('Webhook rejeitado: Nenhum e-mail encontrado no payload.');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Nenhum e-mail de comprador encontrado.' }),
            };
        }

        const email = emailInput.trim().toLowerCase();
        console.log(`Processando pagamento para: ${email} (Status: ${statusInput})`);

        // Check if status indicates a successful payment
        const successStatuses = [
            'approved', 'paid', 'succeeded', 'completed',
            'pago', 'aprovado',
            'payment.approved', 'payment.succeeded',
        ];

        const isSuccess = successStatuses.includes(String(statusInput).toLowerCase());

        if (!isSuccess) {
            console.log(`Webhook ignorado: status "${statusInput}" não é de aprovação.`);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Webhook recebido, mas status não é de aprovação.' }),
            };
        }

        // Query Firestore for the store with this email
        const database = getDb();
        const storesRef = collection(database, 'stores');
        const q = query(storesRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn(`Nenhuma conta encontrada com o e-mail: ${email}`);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Webhook recebido, mas nenhum usuário correspondente.' }),
            };
        }

        // Upgrade all matching stores to PRO (idempotent — skip if already PRO)
        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            if (data.subscriptionStatus === 'pro') {
                console.log(`Loja [ID: ${docSnap.id}] já é PRO. Pulando.`);
                continue;
            }
            const storeDocRef = doc(database, 'stores', docSnap.id);
            await updateDoc(storeDocRef, { subscriptionStatus: 'pro' });
            console.log(`Loja [ID: ${docSnap.id}] atualizada para plano PRO!`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Usuário liberado com plano PRO!' }),
        };
    } catch (error) {
        console.error('Erro ao processar webhook:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro interno ao processar a liberação.' }),
        };
    }
};
