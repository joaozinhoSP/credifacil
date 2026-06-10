import { 
    createUserWithEmailAndPassword as firebaseCreateUser, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function registerUser(email: string, password: string, name: string, shopName: string) {
    try {
        const userCredential = await firebaseCreateUser(auth, email, password);
        const user = userCredential.user;
        
        // Create store entry in Firestore
        await setDoc(doc(db, 'stores', user.uid), {
            storeId: user.uid,
            name: shopName,
            ownerName: name,
            ownerId: user.uid,
            email: email.trim().toLowerCase(),
            subscriptionStatus: 'free',
            settings: {}
        });
        
        return user;
    } catch (error) {
        console.error('Erro detalhado no registro:', error);
        throw error;
    }
}

export async function loginUser(email: string, password: string) {
    return await signInWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Ensure store exists for Google user
        const storeRef = doc(db, 'stores', user.uid);
        const storeSnap = await getDoc(storeRef);
        
        if (!storeSnap.exists()) {
            await setDoc(storeRef, {
                storeId: user.uid,
                name: user.displayName || 'Nova Loja',
                ownerId: user.uid,
                email: (user.email || '').trim().toLowerCase(),
                subscriptionStatus: 'free',
                settings: {}
            });
        }
        
        return user;
    } catch (error: any) {
        console.error('Erro de login com Google:', error);
        throw error;
    }
}
