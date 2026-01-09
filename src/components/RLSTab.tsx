import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Pencil
} from 'lucide-react';
import { TabName } from '../types/api';

// Se VITE_BACKEND_URL estiver definido, usa ele (para acesso via proxy do portal)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '');
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

interface RLSTabProps {
  availableStores: { codigo: string; loja: string; regional: string }[];
}

// Permissão unificada por usuário
interface UserPermission {
  id?: string;
  odbc_id?: string;
  userId: number;
  userName: string;
  allowedTabs: TabName[];
  filterType: 'loja' | 'regional' | 'all';
  filterValues: string[];
}

const AVAILABLE_TABS: { value: TabName; label: string }[] = [
  { value: 'indicadores', label: 'Indicadores' },
  { value: 'monitor', label: 'Monitor' },
];

export function RLSTab({ availableStores }: RLSTabProps) {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<UserPermission | null>(null);
  const [formData, setFormData] = useState<UserPermission>({
    userId: 0,
    userName: '',
    allowedTabs: ['indicadores', 'monitor'],
    filterType: 'all',
    filterValues: []
  });

  // Obter regionais únicas
  const uniqueRegionals = [...new Set(availableStores.map(s => s.regional))].sort();

  // Carregar configurações
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/rls/config`);
      if (response.ok) {
        const data = await response.json();

        // Unificar permissões por usuário
        const userMap = new Map<number, UserPermission>();

        // Processar permissões de tabs
        for (const tabPerm of (data.tabPermissions || [])) {
          const existing = userMap.get(tabPerm.userId);
          if (existing) {
            existing.allowedTabs = tabPerm.allowedTabs || ['indicadores', 'monitor'];
          } else {
            userMap.set(tabPerm.userId, {
              id: tabPerm.id,
              userId: tabPerm.userId,
              userName: tabPerm.userName || '',
              allowedTabs: tabPerm.allowedTabs || ['indicadores', 'monitor'],
              filterType: 'all',
              filterValues: []
            });
          }
        }

        // Processar permissões de lojas
        for (const storePerm of (data.storePermissions || [])) {
          const existing = userMap.get(storePerm.userId);
          if (existing) {
            existing.filterType = storePerm.filterType || 'all';
            existing.filterValues = storePerm.filterValues || [];
          } else {
            userMap.set(storePerm.userId, {
              id: storePerm.id,
              userId: storePerm.userId,
              userName: storePerm.userName || '',
              allowedTabs: ['indicadores', 'monitor'],
              filterType: storePerm.filterType || 'all',
              filterValues: storePerm.filterValues || []
            });
          }
        }

        setPermissions(Array.from(userMap.values()).sort((a, b) => a.userId - b.userId));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações RLS:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (updatedPermissions: UserPermission[]) => {
    setIsSaving(true);
    setMessage(null);
    try {
      // Separar em tabPermissions e storePermissions para o backend
      const tabPermissions = updatedPermissions.map(p => ({
        id: p.id,
        userId: p.userId,
        userName: p.userName,
        allowedTabs: p.allowedTabs
      }));

      const storePermissions = updatedPermissions.map(p => ({
        id: p.id,
        userId: p.userId,
        userName: p.userName,
        filterType: p.filterType,
        filterValues: p.filterValues
      }));

      const response = await fetch(`${API_BASE}/rls/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabPermissions, storePermissions }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        setPermissions(updatedPermissions);
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

  // Abrir modal para nova permissão
  const openNewPermissionModal = () => {
    setEditingPermission(null);
    setFormData({
      userId: 0,
      userName: '',
      allowedTabs: ['indicadores', 'monitor'],
      filterType: 'all',
      filterValues: []
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar permissão
  const openEditModal = (permission: UserPermission) => {
    setEditingPermission(permission);
    setFormData({ ...permission });
    setIsModalOpen(true);
  };

  // Salvar permissão do modal
  const handleSavePermission = async () => {
    if (!formData.userId || formData.userId === 0) {
      setMessage({ type: 'error', text: 'ID do usuário é obrigatório.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    let updatedPermissions: UserPermission[];

    if (editingPermission) {
      // Editar existente
      updatedPermissions = permissions.map(p =>
        p.userId === editingPermission.userId ? { ...formData } : p
      );
    } else {
      // Verificar se usuário já existe
      if (permissions.some(p => p.userId === formData.userId)) {
        setMessage({ type: 'error', text: 'Já existe uma permissão para este usuário.' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      // Adicionar novo
      updatedPermissions = [...permissions, { ...formData, id: crypto.randomUUID() }];
    }

    await saveConfig(updatedPermissions);
    setIsModalOpen(false);
  };

  // Excluir permissão
  const handleDelete = async (userId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta permissão?')) return;

    const updatedPermissions = permissions.filter(p => p.userId !== userId);
    await saveConfig(updatedPermissions);
  };

  // Toggle tab no formulário
  const toggleFormTab = (tab: TabName) => {
    const current = formData.allowedTabs;
    const updated = current.includes(tab)
      ? current.filter(t => t !== tab)
      : [...current, tab];
    setFormData({ ...formData, allowedTabs: updated });
  };

  // Toggle filter value no formulário
  const toggleFormFilterValue = (value: string) => {
    const current = formData.filterValues;
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFormData({ ...formData, filterValues: updated });
  };

  // Formatar tipo de filtro para exibição
  const formatFilterType = (type: string, values: string[]) => {
    if (type === 'all') return 'Todas';
    if (type === 'regional') return values.length > 0 ? values.join(', ') : 'Regional';
    if (type === 'loja') return values.length > 0 ? `${values.length} loja(s)` : 'Loja';
    return type;
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
            Permissões Cadastradas
          </h2>
          <p className="text-sm text-gray-500">
            Usuários com permissões específicas. Usuários não listados têm acesso total.
          </p>
        </div>
        <button
          onClick={openNewPermissionModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Nova Permissão
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

      {/* Tabela de Permissões */}
      {permissions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma permissão cadastrada</p>
          <p className="text-sm text-gray-400 mt-1">Todos os usuários têm acesso completo ao sistema</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Guias Permitidas
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Filtro de Lojas
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {permissions.map((permission) => (
                <tr key={permission.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{permission.userName || 'Sem nome'}</p>
                      <p className="text-xs text-gray-500">ID: {permission.userId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {permission.allowedTabs.length === AVAILABLE_TABS.length ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
                          Todas
                        </span>
                      ) : (
                        permission.allowedTabs.map(tab => (
                          <span key={tab} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                            {AVAILABLE_TABS.find(t => t.value === tab)?.label || tab}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {permission.filterType === 'all' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
                        Todas
                      </span>
                    ) : (
                      <div>
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                          {permission.filterType === 'regional' ? 'Regional' : 'Loja'}
                        </span>
                        {permission.filterValues.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatFilterType(permission.filterType, permission.filterValues)}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(permission)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(permission.userId)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingPermission ? 'Editar Permissão' : 'Nova Permissão'}
                </h3>
                <p className="text-sm text-gray-500">
                  Configure as permissões do usuário
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-5">
              {/* ID e Nome do Usuário */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID do Usuário *
                  </label>
                  <input
                    type="number"
                    value={formData.userId || ''}
                    onChange={(e) => setFormData({ ...formData, userId: parseInt(e.target.value) || 0 })}
                    disabled={!!editingPermission}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Ex: 42"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Usuário *
                  </label>
                  <input
                    type="text"
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: João Silva"
                  />
                </div>
              </div>

              {/* Guias Permitidas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guias Permitidas
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => toggleFormTab(tab.value)}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        formData.allowedTabs.includes(tab.value)
                          ? 'bg-primary-100 text-primary-700 border-2 border-primary-400'
                          : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de Filtro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtro de Lojas/Regionais
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="filterType"
                      checked={formData.filterType === 'all'}
                      onChange={() => setFormData({ ...formData, filterType: 'all', filterValues: [] })}
                      className="w-4 h-4 text-primary-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Todas as Lojas</p>
                      <p className="text-xs text-gray-500">Usuário pode ver todas as lojas</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="filterType"
                      checked={formData.filterType === 'regional'}
                      onChange={() => setFormData({ ...formData, filterType: 'regional', filterValues: [] })}
                      className="w-4 h-4 text-primary-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Por Regional</p>
                      <p className="text-xs text-gray-500">Filtrar por regionais específicas</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="filterType"
                      checked={formData.filterType === 'loja'}
                      onChange={() => setFormData({ ...formData, filterType: 'loja', filterValues: [] })}
                      className="w-4 h-4 text-primary-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Por Loja</p>
                      <p className="text-xs text-gray-500">Filtrar por lojas específicas</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Seleção de Regionais ou Lojas */}
              {formData.filterType !== 'all' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.filterType === 'regional' ? 'Selecione as Regionais' : 'Selecione as Lojas'}
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    <div className="flex flex-wrap gap-2">
                      {formData.filterType === 'regional' ? (
                        uniqueRegionals.map((regional) => (
                          <button
                            key={regional}
                            type="button"
                            onClick={() => toggleFormFilterValue(regional)}
                            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                              formData.filterValues.includes(regional)
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {regional}
                          </button>
                        ))
                      ) : (
                        availableStores.map((store) => (
                          <button
                            key={store.codigo}
                            type="button"
                            onClick={() => toggleFormFilterValue(store.codigo)}
                            className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                              formData.filterValues.includes(store.codigo)
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                            title={store.loja}
                          >
                            {store.codigo}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  {formData.filterValues.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.filterValues.length} selecionado(s)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermission}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
