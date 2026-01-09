/**
 * Portal Integration Script
 *
 * Este script permite a comunicação bidirecional entre o sistema
 * e o Portal Gateway quando embedado em um iframe.
 *
 * Funcionalidades:
 * - Monitora scroll e notifica o parent sobre mudanças de estado
 * - Recebe comandos do parent (ex: scroll to top)
 * - Funciona de forma segura tanto em iframe quanto standalone
 */
(function() {
  'use strict';

  // ==========================================
  // Configuração
  // ==========================================

  var SCROLL_THRESHOLD = 100; // pixels
  var THROTTLE_DELAY = 100;   // ms - delay para throttle do scroll

  // Tipos de mensagens
  var MSG_TYPES = {
    SCROLL_UPDATE: 'PORTAL_SCROLL_UPDATE',
    CMD_SCROLL_TOP: 'CMD_SCROLL_TO_TOP'
  };

  // ==========================================
  // Verificação de Ambiente
  // ==========================================

  /**
   * Verifica se o script está rodando dentro de um iframe
   * @returns {boolean}
   */
  function isInIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      // Se der erro de cross-origin, está em iframe
      return true;
    }
  }

  // Só executa se estiver em iframe
  if (!isInIframe()) {
    console.log('[Portal Integration] Rodando standalone - integração desativada');
    return;
  }

  console.log('[Portal Integration] Detectado ambiente iframe - integração ativada');

  // ==========================================
  // Estado
  // ==========================================

  var state = {
    isScrolled: false,
    lastScrollY: 0,
    throttleTimer: null
  };

  // ==========================================
  // Funções Utilitárias
  // ==========================================

  /**
   * Envia mensagem para o parent window
   * @param {object} message - Objeto da mensagem
   */
  function sendToParent(message) {
    try {
      window.parent.postMessage(message, '*');
    } catch (e) {
      console.warn('[Portal Integration] Erro ao enviar mensagem:', e);
    }
  }

  /**
   * Envia atualização de estado do scroll para o parent
   * @param {boolean} isScrolled - Se a página está rolada
   */
  function sendScrollUpdate(isScrolled) {
    sendToParent({
      type: MSG_TYPES.SCROLL_UPDATE,
      isScrolled: isScrolled,
      scrollY: window.scrollY,
      timestamp: Date.now()
    });
  }

  // ==========================================
  // Monitoramento de Scroll (Emissor)
  // ==========================================

  /**
   * Handler do evento de scroll com throttle
   */
  function handleScroll() {
    // Throttle: ignora se já tem um timer pendente
    if (state.throttleTimer) {
      return;
    }

    state.throttleTimer = setTimeout(function() {
      state.throttleTimer = null;
      processScroll();
    }, THROTTLE_DELAY);
  }

  /**
   * Processa a lógica do scroll e envia mensagem se necessário
   */
  function processScroll() {
    var currentScrollY = window.scrollY || window.pageYOffset || 0;
    var wasScrolled = state.isScrolled;
    var isNowScrolled = currentScrollY > SCROLL_THRESHOLD;

    // Só envia mensagem se o estado mudou
    if (wasScrolled !== isNowScrolled) {
      state.isScrolled = isNowScrolled;
      sendScrollUpdate(isNowScrolled);

      console.log('[Portal Integration] Scroll state changed:', {
        isScrolled: isNowScrolled,
        scrollY: currentScrollY
      });
    }

    state.lastScrollY = currentScrollY;
  }

  // ==========================================
  // Receptor de Comandos
  // ==========================================

  /**
   * Handler para mensagens recebidas do parent
   * @param {MessageEvent} event
   */
  function handleMessage(event) {
    // Validação básica da mensagem
    if (!event.data || typeof event.data !== 'object') {
      return;
    }

    var message = event.data;

    switch (message.type) {
      case MSG_TYPES.CMD_SCROLL_TOP:
        scrollToTop();
        break;

      // Adicione outros comandos aqui conforme necessário
      default:
        // Ignora mensagens não reconhecidas
        break;
    }
  }

  /**
   * Rola a página para o topo suavemente
   */
  function scrollToTop() {
    console.log('[Portal Integration] Comando recebido: scroll to top');

    // Executa o scroll suave
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Atualiza o estado imediatamente
    state.isScrolled = false;
    state.lastScrollY = 0;

    // Força o envio da mensagem de estado para garantir sincronia
    // Pequeno delay para dar tempo do scroll iniciar
    setTimeout(function() {
      sendScrollUpdate(false);
    }, 50);
  }

  // ==========================================
  // Inicialização
  // ==========================================

  /**
   * Inicializa os event listeners
   */
  function init() {
    // Listener de scroll com throttle
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Listener para receber mensagens do parent
    window.addEventListener('message', handleMessage, false);

    // Envia estado inicial
    var initialScrolled = (window.scrollY || window.pageYOffset || 0) > SCROLL_THRESHOLD;
    state.isScrolled = initialScrolled;

    // Notifica o parent que a integração está pronta
    sendToParent({
      type: 'PORTAL_INTEGRATION_READY',
      isScrolled: initialScrolled,
      timestamp: Date.now()
    });

    console.log('[Portal Integration] Inicializado com sucesso');
  }

  // Executa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==========================================
  // API Pública (opcional)
  // ==========================================

  // Expõe API para uso programático se necessário
  window.PortalIntegration = {
    scrollToTop: scrollToTop,
    sendScrollUpdate: sendScrollUpdate,
    getState: function() {
      return {
        isScrolled: state.isScrolled,
        lastScrollY: state.lastScrollY,
        isInIframe: true
      };
    }
  };

})();
