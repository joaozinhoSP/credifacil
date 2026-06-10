import React, { useState, useEffect } from 'react';
import { loginUser, loginWithGoogle } from '../lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { user, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await loginUser(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Login falhou. Verifique suas credenciais.');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(`Erro ao usar Google: ${err.message || 'Falha desconhecida'}`);
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
                <h1 className="text-2xl font-bold mb-6 text-emerald-600">CrediFácil - Login</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 mb-4 border rounded" required />
                <button type="submit" className="w-full bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700 mb-4 font-semibold cursor-pointer">Entrar</button>
                <button type="button" onClick={handleGoogleLogin} className="w-full bg-white border border-gray-300 text-gray-700 p-2 rounded hover:bg-gray-50 mb-4 font-semibold cursor-pointer">Entrar com Google</button>
                <p className="text-center text-sm text-gray-600">
                    Não tem uma conta? <Link to="/register" className="text-emerald-600 hover:underline">Cadastre-se</Link>
                </p>
            </form>
        </div>
    );
}
