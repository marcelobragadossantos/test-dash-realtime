import { useState, useEffect } from 'react';
import {
  Users,
  Store,
  Plus,
  Trash2,
  Save,
  Shield,
  Eye,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { TabPermission, StorePermission, TabName } from '../types/api';

interface RLSTabProps {
  availableStores: { codigo: string; loja: string; regional: string }[];
}

const AVAILABLE_TABS: { value: TabName; label: string }[] = [
  { value: 'indicadores', label: 'Indicadores' },
  { value: 'monitor', label: 'Monitor' },
];

export function RLSTab({ availableStores }: RLSTabProps) {
  const [activeSection, setActiveSection] = useState<'tabs' | 'stores'>('tabs');
  const [tabPermissions, setTabPermissions] = useState<TabPermission[]>([]);
  const [storePermissions, setStorePermissions] = useState<StorePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Obter regionais únicas
  const uniqueRegionals = [...new Set(availableStores.map(s => s.regional))].sort();

  // Carregar configurações
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/rls/config');
      if (response.ok) {
        const data = await response.json();
        setTabPermissions(data.tabPermissions || []);
        setStorePermissions(data.storePermissions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações RLS:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/rls/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabPermissions, storePermissions }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Handlers para Tab Permissions
  const addTabPermission = () => {
    setTabPermissions([
      ...tabPermissions,
      { id: crypto.randomUUID(), userId: 0, userName: '', allowedTabs: ['indicadores'] }
    ]);
  };

  const updateTabPermission = (index: number, updates: Partial<TabPermission>) => {
    const updated = [...tabPermissions];
    updated[index] = { ...updated[index], ...updates };
    setTabPermissions(updated);
  };

  const removeTabPermission = (index: number) => {
    setTabPermissions(tabPermissions.filter((_, i) => i !== index));
  };

  const toggleTab = (index: number, tab: TabName) => {
    const current = tabPermissions[index].allowedTabs;
    const updated = current.includes(tab)
      ? current.filter(t => t !== tab)
      : [...current, tab];
    updateTabPermission(index, { allowedTabs: updated });
  };

  // Handlers para Store Permissions
  const addStorePermission = () => {
    setStorePermissions([
      ...storePermissions,
      { id: crypto.randomUUID(), userId: 0, userName: '', filterType: 'all', filterValues: [] }
    ]);
  };

  const updateStorePermission = (index: number, updates: Partial<StorePermission>) => {
    const updated = [...storePermissions];
    updated[index] = { ...updated[index], ...updates };
    setStorePermissions(updated);
  };

  const removeStorePermission = (index: number) => {
    setStorePermissions(storePermissions.filter((_, i) => i !== index));
  };

  const toggleFilterValue = (index: number, value: string) => {
    const current = storePermissions[index].filterValues;
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateStorePermission(index, { filterValues: updated });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            Gerenciamento de Permissões (RLS)
          </h2>
          <p className="text-sm text-gray-500">
            Configure quais usuários podem acessar cada guia e visualizar lojas
          </p>
        </div>
        <button
          onClick={saveConfig}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('tabs')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'tabs'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Eye className="w-4 h-4" />
          Acesso às Guias
        </button>
        <button
          onClick={() => setActiveSection('stores')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'stores'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Store className="w-4 h-4" />
          Filtro de Lojas/Regionais
        </button>
      </div>

      {/* Tab Permissions Section */}
      {activeSection === 'tabs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Definir quais guias cada usuário pode ver
            </h3>
            <button
              onClick={addTabPermission}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
              Adicionar Usuário
            </button>
          </div>

          {tabPermissions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Nenhuma regra de acesso configurada</p>
              <p className="text-xs text-gray-400">Todos os usuários têm acesso a todas as guias</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tabPermissions.map((permission, index) => (
                <div key={permission.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">ID do Usuário</label>
                        <input
                          type="number"
                          value={permission.userId || ''}
                          onChange={(e) => updateTabPermission(index, { userId: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Ex: 42"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome (referência)</label>
                        <input
                          type="text"
                          value={permission.userName}
                          onChange={(e) => updateTabPermission(index, { userName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Ex: João Silva"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeTabPermission(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-500 mb-2">Guias Permitidas</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TABS.map((tab) => (
                        <button
                          key={tab.value}
                          onClick={() => toggleTab(index, tab.value)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            permission.allowedTabs.includes(tab.value)
                              ? 'bg-primary-100 text-primary-700 border border-primary-300'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Store Permissions Section */}
      {activeSection === 'stores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Definir quais lojas/regionais cada usuário pode ver
            </h3>
            <button
              onClick={addStorePermission}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
              Adicionar Regra
            </button>
          </div>

          {storePermissions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Nenhum filtro de lojas configurado</p>
              <p className="text-xs text-gray-400">Todos os usuários veem todas as lojas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {storePermissions.map((permission, index) => (
                <div key={permission.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">ID do Usuário</label>
                        <input
                          type="number"
                          value={permission.userId || ''}
                          onChange={(e) => updateStorePermission(index, { userId: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Ex: 42"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome (referência)</label>
                        <input
                          type="text"
                          value={permission.userName}
                          onChange={(e) => updateStorePermission(index, { userName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Ex: João Silva"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Filtro</label>
                        <select
                          value={permission.filterType}
                          onChange={(e) => updateStorePermission(index, {
                            filterType: e.target.value as 'loja' | 'regional' | 'all',
                            filterValues: []
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="all">Todas as Lojas</option>
                          <option value="regional">Por Regional</option>
                          <option value="loja">Por Loja</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => removeStorePermission(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {permission.filterType !== 'all' && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-500 mb-2">
                        {permission.filterType === 'regional' ? 'Regionais Permitidas' : 'Lojas Permitidas'}
                      </label>
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                        <div className="flex flex-wrap gap-2">
                          {permission.filterType === 'regional' ? (
                            uniqueRegionals.map((regional) => (
                              <button
                                key={regional}
                                onClick={() => toggleFilterValue(index, regional)}
                                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                  permission.filterValues.includes(regional)
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}
                              >
                                {regional}
                              </button>
                            ))
                          ) : (
                            availableStores.map((store) => (
                              <button
                                key={store.codigo}
                                onClick={() => toggleFilterValue(index, store.codigo)}
                                className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                                  permission.filterValues.includes(store.codigo)
                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}
                                title={store.loja}
                              >
                                {store.codigo}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                      {permission.filterValues.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {permission.filterValues.length} selecionado(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
