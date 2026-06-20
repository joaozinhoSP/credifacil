import React, { useState, useEffect } from 'react';
import { loginUser, loginWithGoogle, resendVerificationEmail } from '../lib/auth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { user, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [verifyResent, setVerifyResent] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await loginUser(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            const msg = err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential'
                ? 'E-mail ou senha incorretos.'
                : err?.code === 'auth/invalid-email'
                ? 'E-mail inválido.'
                : err?.code === 'auth/too-many-requests'
                ? 'Muitas tentativas. Aguarde um pouco e tente novamente.'
                : err?.code === 'auth/user-disabled'
                ? 'Esta conta foi desativada.'
                : 'Falha ao fazer login. Verifique os dados e tente novamente.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setSubmitting(true);
        try {
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (err: any) {
            setError(`Erro ao usar Google: ${err.message || 'Falha desconhecida'}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            setError('Digite seu e-mail primeiro.');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setResetSent(true);
            setError('');
        } catch (err: any) {
            const msg = err?.code === 'auth/user-not-found'
                ? 'Este e-mail não está cadastrado.'
                : 'Erro ao enviar e-mail de redefinição.';
            setError(msg);
        }
    };

    const handleResendVerification = async () => {
        try {
            await loginUser(email, password);
        } catch {
            // Just try to login to get the user object — if it succeeds, resend
        }
        try {
            await resendVerificationEmail();
            setVerifyResent(true);
            setError('');
        } catch {
            setError('Erro ao reenviar verificação. Tente novamente.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-gray-500">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
                <div className="flex flex-col items-center mb-6">
                    <img src="/logo.png" alt="GestãoPro" className="h-14 w-auto mb-3" />
                    <h1 className="text-2xl font-bold text-emerald-600">Login</h1>
                </div>
                {resetSent && <p className="text-emerald-600 text-sm mb-4 font-semibold">E-mail de redefinição enviado! Verifique sua caixa de entrada.</p>}
                {verifyResent && <p className="text-emerald-600 text-sm mb-4 font-semibold">E-mail de verificação reenviado! Verifique sua caixa de entrada e spam.</p>}
                {error && (
                    <div className="text-red-500 mb-4 text-sm">
                        <p>{error}</p>
                        {error.includes('senha incorretos') && (
                            <button type="button" onClick={handleResendVerification} className="text-emerald-600 hover:underline text-xs mt-1 cursor-pointer">
                                Reenviar e-mail de verificação
                            </button>
                        )}
                    </div>
                )}
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                <button type="submit" disabled={submitting} className="w-full bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700 mb-4 font-semibold cursor-pointer disabled:opacity-50">{submitting ? 'Entrando...' : 'Entrar'}</button>
                <button type="button" onClick={handleGoogleLogin} disabled={submitting} className="w-full bg-white border border-gray-300 text-gray-700 p-2 rounded hover:bg-gray-50 mb-4 font-semibold cursor-pointer disabled:opacity-50">Entrar com Google</button>
                <div className="text-center text-sm text-gray-600 space-y-1">
                    <p><button type="button" onClick={handleResetPassword} className="text-emerald-600 hover:underline cursor-pointer">Esqueci minha senha</button></p>
                    <p>Não tem uma conta? <Link to="/register" className="text-emerald-600 hover:underline">Cadastre-se</Link></p>
                </div>
            </form>
        </div>
    );
}
