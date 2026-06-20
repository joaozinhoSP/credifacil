import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', phone: '', baseAddress: '', startTime: '08:00', avgServiceTime: 30 });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        baseAddress: user.baseAddress || '',
        startTime: user.startTime || '08:00',
        avgServiceTime: user.avgServiceTime || 30,
      });
    }
  }, [user]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile(form);
      await refreshUser();
      setSaved('Perfil atualizado!');
      setTimeout(() => setSaved(''), 3000);
    } catch { }
    setLoading(false);
  };

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
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</h2>

          {saved && <p className="text-green-600 text-sm mb-4 bg-green-50 px-4 py-2 rounded-lg">{saved}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                <input type="text" value={form.name} onChange={update('name')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                <input type="text" value={form.phone} onChange={update('phone')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Endereço base</label>
                <input type="text" value={form.baseAddress} onChange={update('baseAddress')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Horário de início do dia</label>
                <input type="time" value={form.startTime} onChange={update('startTime')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tempo médio por visita (min)</label>
                <input type="number" value={form.avgServiceTime} onChange={update('avgServiceTime')} min={1} max={240}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors">
              {loading ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
