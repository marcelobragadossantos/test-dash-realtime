import { useState, useEffect } from 'react';

// Se VITE_BACKEND_URL estiver definido, usa ele (para acesso via proxy do portal)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '');
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

export interface UserPermissions {
  userId: number;
  tabs: string[];
  stores: {
    filterType: 'loja' | 'regional' | 'all';
    filterValues: string[];
  };
}

export function useUserPermissions(userId: number | null) {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId === null) {
      // Usuário não identificado - permissões padrão (tudo liberado exceto RLS)
      setPermissions({
        userId: 0,
        tabs: ['indicadores', 'monitor'],
        stores: { filterType: 'all', filterValues: [] }
      });
      return;
    }

    const fetchPermissions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/rls/user/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setPermissions(data);
        } else {
          // Em caso de erro, usa permissões padrão
          setPermissions({
            userId,
            tabs: ['indicadores', 'monitor'],
            stores: { filterType: 'all', filterValues: [] }
          });
        }
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        // Em caso de erro, usa permissões padrão
        setPermissions({
          userId,
          tabs: ['indicadores', 'monitor'],
          stores: { filterType: 'all', filterValues: [] }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [userId]);

  return { permissions, isLoading };
}
