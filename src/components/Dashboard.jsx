import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import RouteMap from './RouteMap';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [visits, setVisits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', number: '', neighborhood: '', city: '', zipCode: '', phone: '', timeWindow: 'none' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [routeResult, setRouteResult] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [waLinks, setWaLinks] = useState([]);
  const [showWaLinks, setShowWaLinks] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadVisits = async () => {
    try {
      const data = await api.getVisits();
      setVisits(data.filter(v => v.status === 'draft' && !v.routeId));
    } catch { }
  };

  useEffect(() => { loadVisits() }, []);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editingId) {
        await api.updateVisit(editingId, form);
      } else {
        await api.createVisit(form);
      }
      setForm({ name: '', address: '', number: '', neighborhood: '', city: '', zipCode: '', phone: '', timeWindow: 'none' });
      setEditingId(null);
      setShowForm(false);
      await loadVisits();
      setSuccess(editingId ? 'Visita atualizada!' : 'Visita adicionada!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const editVisit = (v) => {
    setForm({
      name: v.name, address: v.address, number: v.number,
      neighborhood: v.neighborhood, city: v.city, zipCode: v.zipCode,
      phone: v.phone, timeWindow: v.timeWindow,
    });
    setEditingId(v.id);
    setShowForm(true);
  };

  const deleteVisit = async (id) => {
    if (!confirm('Remover esta visita?')) return;
    await api.deleteVisit(id);
    await loadVisits();
  };

  const duplicateVisit = async (id) => {
    await api.duplicateVisit(id);
    await loadVisits();
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    setError('');
    setRouteResult(null);
    setWaLinks([]);
    setShowWaLinks(false);
    try {
      const data = await api.optimizeRoute();
      setRouteResult(data);
    } catch (err) {
      setError(err.message);
      if (err.data?.limitExceeded) {
        // show upgrade prompt
      }
    } finally {
      setOptimizing(false);
    }
  };

  const handleSaveRoute = async () => {
    if (!routeResult) return;
    try {
      await api.saveRoute({
        visitIds: routeResult.orderedVisits.map(v => v.id),
        optimizedOrder: routeResult.optimizedOrder,
        totalDuration: routeResult.totalDurationMinutes,
      });
      setSuccess('Rota salva no histórico!');
      setTimeout(() => setSuccess(''), 3000);
      setRouteResult(null);
      await loadVisits();
    } catch (err) {
      setError(err.message);
    }
  };

  const generateWaLinks = () => {
    if (!routeResult) return;
    const links = routeResult.orderedVisits.map(v => {
      const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(`${v.address}, ${v.number}, ${v.neighborhood}, ${v.city}`)}`;
      const text = `Olá ${v.name}, sua visita técnica está agendada para hoje às ${v.arrivalTime}. Acompanhe minha localização: ${mapsUrl}`;
      const waUrl = `https://wa.me/55${v.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
      return { name: v.name, phone: v.phone, url: waUrl, arrivalTime: v.arrivalTime, text };
    });
    setWaLinks(links);
    setShowWaLinks(true);
  };

  const copyAllWaLinks = async () => {
    const allText = waLinks.map(l => l.text).join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 3000);
    } catch { }
  };

  const handleCopyPrevious = async () => {
    try {
      const data = await api.copyPreviousVisits();
      await loadVisits();
      setSuccess(data.message);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.getHistory();
      setHistory(data);
      setShowHistory(true);
    } catch { }
  };

  const timeWindows = [
    { value: 'none', label: 'Sem preferência' },
    { value: 'morning', label: 'Manhã (até 12h)' },
    { value: 'afternoon', label: 'Tarde (após 13h)' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-blue-600">GestãoPro</h1>
            <span className="text-sm text-gray-500">
              {user?.name} {user?.plan === 'paid' ? '⭐ Premium' : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/profile" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Perfil
            </Link>
            <Link to="/billing" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Plano
            </Link>
            <button onClick={() => { logout(); navigate('/login') }}
              className="text-sm text-red-500 hover:text-red-700 cursor-pointer transition-colors">
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Visitas do Dia</h2>
            <p className="text-sm text-gray-500">{visits.length} visita(s) cadastrada(s)</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopyPrevious}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
              Copiar dia anterior
            </button>
            <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', address: '', number: '', neighborhood: '', city: '', zipCode: '', phone: '', timeWindow: 'none' }) }}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
              + Nova visita
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{editingId ? 'Editar visita' : 'Nova visita'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nome do cliente</label>
                <input type="text" value={form.name} onChange={update('name')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Logradouro</label>
                <input type="text" value={form.address} onChange={update('address')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Número</label>
                <input type="text" value={form.number} onChange={update('number')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Bairro</label>
                <input type="text" value={form.neighborhood} onChange={update('neighborhood')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cidade</label>
                <input type="text" value={form.city} onChange={update('city')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">CEP</label>
                <input type="text" value={form.zipCode} onChange={update('zipCode')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Telefone do cliente</label>
                <input type="text" value={form.phone} onChange={update('phone')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Horário preferencial</label>
                <select value={form.timeWindow} onChange={update('timeWindow')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                  {timeWindows.map(tw => <option key={tw.value} value={tw.value}>{tw.label}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer text-sm transition-colors">
                  {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 cursor-pointer text-sm transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {visits.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">Nenhuma visita cadastrada hoje</p>
            <p className="text-gray-400 text-sm">Clique em "+ Nova visita" para começar</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Cliente</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Endereço</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Telefone</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Janela</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visits.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{v.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.address}, {v.number} - {v.neighborhood}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {v.timeWindow === 'morning' ? 'Manhã' : v.timeWindow === 'afternoon' ? 'Tarde' : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button onClick={() => editVisit(v)} className="text-blue-600 hover:text-blue-800 mr-3 cursor-pointer">Editar</button>
                      <button onClick={() => duplicateVisit(v.id)} className="text-gray-600 hover:text-gray-800 mr-3 cursor-pointer">Duplicar</button>
                      <button onClick={() => deleteVisit(v.id)} className="text-red-500 hover:text-red-700 cursor-pointer">Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {visits.length > 0 && (
          <div className="flex gap-3 mb-6">
            <button onClick={handleOptimize} disabled={optimizing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 cursor-pointer transition-colors text-sm">
              {optimizing ? 'Otimizando...' : 'Otimizar Rota'}
            </button>
            <button onClick={loadHistory}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors text-sm">
              Histórico
            </button>
          </div>
        )}

        {optimizing && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-500">Calculando rota otimizada...</p>
            <p className="text-gray-400 text-xs mt-1">Geocodificando endereços e consultando matriz de distâncias</p>
          </div>
        )}

        {routeResult && !optimizing && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Rota Otimizada</h3>
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Total: ~{routeResult.totalDurationMinutes} min
                  </span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {routeResult.orderedVisits.length} visitas
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm">
                  <span className="font-medium text-yellow-800">Ponto de partida</span>
                  <span className="text-yellow-600">{user?.baseAddress}</span>
                  <span className="text-yellow-500 text-xs">Saída: {routeResult.startTime}</span>
                </div>
                {routeResult.orderedVisits.map((v, i) => (
                  <div key={v.id}
                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = parseInt(e.dataTransfer.getData('text/plain'));
                      const ordered = [...routeResult.orderedVisits];
                      const [item] = ordered.splice(from, 1);
                      ordered.splice(i, 0, item);
                      const recalc = ordered.map((ov, idx) => ({
                        ...ov,
                        order: idx + 1,
                        arrivalTime: recalcTime(idx, routeResult.startTime, routeResult.avgServiceTime),
                      }));
                      setRouteResult({ ...routeResult, orderedVisits: recalc });
                    }}
                  >
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {v.order}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{v.name}</p>
                      <p className="text-xs text-gray-500 truncate">{v.address}, {v.number} - {v.neighborhood}, {v.city}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-green-600">{v.arrivalTime}</p>
                      <p className="text-xs text-gray-400">
                        {v.timeWindow === 'morning' ? 'Manhã' : v.timeWindow === 'afternoon' ? 'Tarde' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <RouteMap
                baseCoords={routeResult.baseCoords}
                orderedVisits={routeResult.orderedVisits}
              />

              <div className="flex gap-3 mt-4">
                <button onClick={handleSaveRoute}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm transition-colors">
                  Salvar rota
                </button>
                <button onClick={generateWaLinks}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer text-sm transition-colors">
                  Gerar links WhatsApp
                </button>
              </div>
            </div>

            {showWaLinks && waLinks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Links WhatsApp</h3>
                  <button onClick={copyAllWaLinks}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                    {copiedAll ? 'Copiado!' : 'Copiar todas'}
                  </button>
                </div>
                <div className="space-y-2">
                  {waLinks.map((link, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{link.name}</p>
                        <p className="text-xs text-gray-500">Previsto: {link.arrivalTime}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <a href={link.url} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                          Abrir
                        </a>
                        <button onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(link.url);
                            alert('Link copiado!');
                          } catch { }
                        }}
                          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer transition-colors">
                          Copiar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {showHistory && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Histórico de Rotas</h3>
              <button onClick={() => setShowHistory(false)}
                className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Fechar</button>
            </div>
            {history.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma rota salva ainda</p>
            ) : (
              <div className="space-y-2">
                {history.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(r.date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-500">{r.visits?.length || 0} visitas</p>
                    </div>
                    <button onClick={async () => {
                      const routeData = await api.getHistoryRoute(r.id);
                      if (routeData.optimizedOrder) {
                        const order = JSON.parse(routeData.optimizedOrder);
                        const visitsWithCoords = routeData.visits.filter(v => v.lat && v.lng);
                        if (visitsWithCoords.length > 0) {
                          setRouteResult({
                            orderedVisits: order.map((idx, i) => ({
                              order: i + 1,
                              id: visitsWithCoords[idx]?.id || '',
                              name: visitsWithCoords[idx]?.name || '',
                              address: visitsWithCoords[idx]?.address || '',
                              number: visitsWithCoords[idx]?.number || '',
                              neighborhood: visitsWithCoords[idx]?.neighborhood || '',
                              city: visitsWithCoords[idx]?.city || '',
                              arrivalTime: '--:--',
                              lat: visitsWithCoords[idx]?.lat,
                              lng: visitsWithCoords[idx]?.lng,
                            })),
                            baseCoords: { lat: user?.baseLat, lng: user?.baseLng },
                            totalDurationMinutes: r.totalDuration || 0,
                          });
                        }
                      }
                    }}
                      className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                      Ver rota
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function recalcTime(orderIndex, startTime, avgServiceTime) {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + (orderIndex + 1) * 20 + orderIndex * (avgServiceTime || 30);
  const hrs = Math.floor(totalMinutes / 60) % 24;
  const mins = Math.round(totalMinutes % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
