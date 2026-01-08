import { useEffect, useState } from 'react';
import { PortalUser } from '../types/api';

export function usePortalGatewayUser() {
  const [user, setUser] = useState<PortalUser | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      try {
        // Verifica se event.data é um objeto válido com o tipo esperado
        if (
          event.data &&
          typeof event.data === 'object' &&
          event.data.type === 'PORTAL_GATEWAY_USER'
        ) {
          setUser({
            userId: event.data.userId ?? null,
            userName: event.data.userName ?? null,
            userEmail: event.data.userEmail ?? null,
            userRole: event.data.userRole ?? null,
            moduleId: event.data.moduleId ?? null,
            moduleName: event.data.moduleName ?? null,
            timestamp: event.data.timestamp ?? null,
          });
        }
      } catch {
        // Ignora erros de parsing de mensagens inválidas
      }
    }

    window.addEventListener('message', handleMessage);

    // Solicitar dados caso esteja em iframe
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'PORTAL_GATEWAY_REQUEST_USER' }, '*');
      }
    } catch {
      // Ignora erros de cross-origin
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return user;
}
