import express from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

// Load Firebase Config
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig = {};
try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
    console.error('Erro ao ler firebase-applet-config.json:', error);
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Webhook endpoint
app.post('/webhook/fortpay', async (req, res) => {
    console.log('--- Webhook Recebido da FortPay ---');
    console.log('Payload:', JSON.stringify(req.body, null, 2));

    try {
        const payload = req.body;
        
        // Extract email (checking common gateway paths to be extremely robust)
        const emailInput = payload?.email || 
                           payload?.customer?.email || 
                           payload?.payer?.email || 
                           payload?.data?.customer?.email || 
                           payload?.data?.email;

        // Extract status or event
        const statusInput = payload?.status || 
                            payload?.data?.status || 
                            payload?.event;

        if (!emailInput) {
            console.error('Webhook rejeitado: Nenhum e-mail de comprador encontrado no payload.');
            return res.status(400).json({ error: 'Nenhum e-mail de comprador encontrado.' });
        }

        const email = emailInput.trim().toLowerCase();
        console.log(`Processando pagamento para o e-mail: ${email} (Status: ${statusInput})`);

        // Check if status is a successful payment status
        const isSuccess = ['approved', 'paid', 'succeeded', 'completed', 'pago', 'aprovado', 'payment.approved', 'payment.succeeded'].includes(
            String(statusInput).toLowerCase()
        );

        if (!isSuccess) {
            console.log(`Webhook ignorado: O status do pagamento não indica sucesso (${statusInput}).`);
            return res.status(200).json({ message: 'Webhook recebido, mas status não é de aprovação.' });
        }

        // Query Firestore to find the store owner with this email
        const storesRef = collection(db, 'stores');
        const q = query(storesRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn(`Nenhuma conta de loja encontrada com o e-mail: ${email}`);
            return res.status(200).json({ message: 'Webhook recebido, mas nenhum usuário correspondente no banco.' });
        }

        // Update all matching store accounts to PRO
        for (const docSnap of querySnapshot.docs) {
            const storeDocRef = doc(db, 'stores', docSnap.id);
            await updateDoc(storeDocRef, {
                subscriptionStatus: 'pro'
            });
            console.log(`Loja [ID: ${docSnap.id}] atualizada com sucesso para plano PRO!`);
        }

        return res.status(200).json({ success: true, message: 'Usuário liberado com plano PRO com sucesso!' });
    } catch (error) {
        console.error('Erro ao processar o webhook:', error);
        return res.status(500).json({ error: 'Erro interno ao processar a liberação.' });
    }
});

// Serve static build files in production
app.use(express.static(path.resolve(process.cwd(), 'dist')));

// Fallback for SPA Routing in production
app.get('*', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Webhook FortPay aguardando requisições em: POST http://suadominio.com/webhook/fortpay`);
});
