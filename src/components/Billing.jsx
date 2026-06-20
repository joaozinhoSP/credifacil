import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getCheckoutLink();
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isPaid = user?.plan === 'paid';
  const expiresAt = user?.planExpiresAt ? new Date(user.planExpiresAt).toLocaleDateString('pt-BR') : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold text-blue-600">Rota Fácil</Link>
          <Link to="/dashboard" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
            Voltar ao dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Plano e Assinatura</h2>

          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`border-2 rounded-xl p-6 ${!isPaid ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Gratuito</h3>
              <p className="text-3xl font-bold text-gray-800 mb-4">R$ 0</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Até 5 visitas por dia
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Rota otimizada
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Links WhatsApp
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Mapa interativo
                </li>
              </ul>
              {!isPaid && <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">Plano atual</span>}
            </div>

            <div className={`border-2 rounded-xl p-6 ${isPaid ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Premium</h3>
              <p className="text-3xl font-bold text-gray-800 mb-4">R$ 29<small className="text-sm font-normal text-gray-500">/mês</small></p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Visitas ilimitadas
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Rota otimizada
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Links WhatsApp
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Mapa interativo
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Histórico completo
                </li>
              </ul>
              {isPaid ? (
                <div>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Plano atual</span>
                  {expiresAt && <p className="text-xs text-gray-500 mt-2">Válido até {expiresAt}</p>}
                </div>
              ) : (
                <button onClick={handleUpgrade} disabled={loading}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 cursor-pointer transition-colors text-sm">
                  {loading ? 'Redirecionando...' : 'Assinar agora'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Pagamento seguro</h4>
            <p className="text-xs text-gray-500">
              O pagamento é processado por um checkout externo. Você será redirecionado para finalizar a assinatura.
              Após a confirmação, seu plano é ativado automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
