import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './lib/Toast';
import { resendVerificationEmail } from './lib/auth';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Billing from './components/Billing';
import Customers from './components/Customers';
import Debts from './components/Debts';
import CustomerMetrics from './components/CustomerMetrics';
import LandingPage from './components/LandingPage';
import Inventory from './components/Inventory';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [resent, setResent] = useState(false);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <p className="text-gray-500">Carregando...</p>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  if (!user.emailVerified && user.providerData[0]?.providerId !== 'google.com') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
          <img src="/logo.png" alt="CrediFácil" className="h-14 w-auto mx-auto mb-3" />
          <h1 className="text-xl font-bold text-emerald-600 mb-2">Verifique seu e-mail</h1>
          <p className="text-sm text-slate-600 mb-4">
            Enviamos um link de verificação para <strong>{user.email}</strong>.
            Clique no link para ativar sua conta.
          </p>
          {resent && (
            <p className="text-emerald-600 text-sm font-semibold mb-4">
              E-mail reenviado! Verifique sua caixa de entrada e spam.
            </p>
          )}
          <button
            onClick={async () => {
              await resendVerificationEmail();
              setResent(true);
            }}
            className="w-full bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700 font-semibold cursor-pointer mb-3"
          >
            Reenviar e-mail de verificação
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-slate-100 text-slate-600 p-2 rounded hover:bg-slate-200 font-semibold cursor-pointer"
          >
            Fazer login novamente
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/billing" element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="/debts" element={
              <ProtectedRoute>
                <Debts />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/customer/:id" element={
              <ProtectedRoute>
                <CustomerMetrics />
              </ProtectedRoute>
            } />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
