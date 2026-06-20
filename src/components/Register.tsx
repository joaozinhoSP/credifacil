import React, { useState, useEffect } from 'react';
import { registerUser, loginWithGoogle } from '../lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const { user, loading } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [shopName, setShopName] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [registered, setRegistered] = useState(false);
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
            await registerUser(email, password, name, shopName);
            setRegistered(true);
        } catch (err: any) {
            console.error('Erro no registro:', err);
            const msg = err?.code === 'auth/email-already-in-use'
                ? 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.'
                : err?.code === 'auth/weak-password'
                ? 'A senha deve ter pelo menos 6 caracteres.'
                : err?.code === 'auth/invalid-email'
                ? 'E-mail inválido. Verifique e tente novamente.'
                : err?.code === 'auth/network-request-failed'
                ? 'Sem conexão com a internet. Verifique sua rede.'
                : 'Falha ao registrar. Verifique os dados e tente novamente.';
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-gray-500">Carregando...</p>
            </div>
        );
    }

    if (registered) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
                    <img src="/logo.png" alt="GestãoPro" className="h-14 w-auto mx-auto mb-3" />
                    <h1 className="text-xl font-bold text-emerald-600 mb-2">Conta criada com sucesso!</h1>
                    <p className="text-sm text-slate-600 mb-4">
                        Enviamos um e-mail de verificação para <strong>{email}</strong>.
                        Clique no link para ativar sua conta e fazer login.
                    </p>
                    <p className="text-xs text-slate-400 mb-4">
                        Não recebeu? Verifique a caixa de spam ou tente novamente.
                    </p>
                    <Link to="/login" className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700 font-semibold cursor-pointer inline-block">Ir para o Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96 font-sans">
                <div className="flex flex-col items-center mb-6">
                    <img src="/logo.png" alt="GestãoPro" className="h-14 w-auto mb-3" />
                    <h1 className="text-2xl font-bold text-emerald-600">Cadastro</h1>
                </div>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <input type="text" placeholder="Seu Nome" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                <input type="text" placeholder="Nome da Loja" value={shopName} onChange={e => setShopName(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                <button type="submit" disabled={submitting} className="w-full bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700 mb-4 font-semibold cursor-pointer disabled:opacity-50">{submitting ? 'Cadastrando...' : 'Cadastrar'}</button>
                <button type="button" onClick={handleGoogleLogin} disabled={submitting} className="w-full bg-white border border-gray-300 text-gray-700 p-2 rounded hover:bg-gray-50 mb-4 font-semibold cursor-pointer disabled:opacity-50">Cadastrar com Google</button>
                <p className="text-center text-sm text-gray-600">
                    Já tem uma conta? <Link to="/login" className="text-emerald-600 hover:underline">Entre aqui</Link>
                </p>
            </form>
        </div>
    );
}
