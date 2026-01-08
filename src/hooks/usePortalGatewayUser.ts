import { useEffect, useState } from 'react';
import { PortalUser } from '../types/api';

interface PortalGatewayMessage {
  type: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  userRole?: 'admin' | 'user';
  moduleId?: number;
  moduleName?: string;
  timestamp?: number;
}

export function usePortalGatewayUser() {
  const [user, setUser] = useState<PortalUser | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent<PortalGatewayMessage>) {
      if (event.data?.type === 'PORTAL_GATEWAY_USER') {
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
    }

    window.addEventListener('message', handleMessage);

    // Solicitar dados caso tenha perdido a mensagem inicial
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'PORTAL_GATEWAY_REQUEST_USER' }, '*');
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return user;
}
