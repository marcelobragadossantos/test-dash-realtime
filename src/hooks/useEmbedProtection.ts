import { useEffect, useState } from 'react';

interface EmbedProtectionConfig {
  enabled: boolean;
  allowedOrigins: string[];
  redirectUrl: string;
}

interface EmbedProtectionResult {
  isAllowed: boolean;
  isChecking: boolean;
  reason?: string;
}

function getConfig(): EmbedProtectionConfig {
  const enabled = import.meta.env.VITE_EMBED_ENABLED === 'true';
  const allowedOriginsStr = import.meta.env.VITE_ALLOWED_EMBED_ORIGINS || '';
  const allowedOrigins = allowedOriginsStr
    .split(',')
    .map((origin: string) => origin.trim())
    .filter(Boolean);
  const redirectUrl = import.meta.env.VITE_REDIRECT_URL || '';

  return { enabled, allowedOrigins, redirectUrl };
}

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Se der erro de cross-origin, provavelmente está em iframe
    return true;
  }
}

function checkAncestorOrigins(allowedOrigins: string[]): boolean {
  // Verifica se algum ancestral está na lista de permitidos
  if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
    for (let i = 0; i < window.location.ancestorOrigins.length; i++) {
      const ancestorOrigin = window.location.ancestorOrigins[i];
      if (allowedOrigins.some(allowed => ancestorOrigin.startsWith(allowed))) {
        return true;
      }
    }
  }
  return false;
}

export function useEmbedProtection(): EmbedProtectionResult {
  const [result, setResult] = useState<EmbedProtectionResult>({
    isAllowed: true,
    isChecking: true,
  });

  useEffect(() => {
    const config = getConfig();

    // Se a proteção não está ativada, permite acesso
    if (!config.enabled) {
      setResult({ isAllowed: true, isChecking: false });
      return;
    }

    // Verifica se está em iframe
    const inIframe = isInIframe();

    if (!inIframe) {
      // Acesso direto não permitido quando proteção está ativa
      if (config.redirectUrl) {
        window.location.href = config.redirectUrl;
      }
      setResult({
        isAllowed: false,
        isChecking: false,
        reason: 'Acesso direto não permitido. Use o Portal Gateway.',
      });
      return;
    }

    // Está em iframe, verifica se a origem é permitida
    if (config.allowedOrigins.length > 0) {
      const originAllowed = checkAncestorOrigins(config.allowedOrigins);

      if (!originAllowed) {
        // Origem não permitida
        setResult({
          isAllowed: false,
          isChecking: false,
          reason: 'Origem não autorizada.',
        });
        return;
      }
    }

    // Tudo OK
    setResult({ isAllowed: true, isChecking: false });
  }, []);

  return result;
}
