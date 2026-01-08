import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShieldX } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { useEmbedProtection } from './hooks/useEmbedProtection';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function BlockedAccess({ reason }: { reason?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
      <div className="text-center px-6">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <ShieldX className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Acesso Bloqueado</h1>
        <p className="text-red-200 mb-4">
          {reason || 'Este aplicativo só pode ser acessado através do Portal Gateway.'}
        </p>
        <p className="text-red-300 text-sm">
          Entre em contato com o administrador se precisar de acesso.
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAllowed, isChecking, reason } = useEmbedProtection();

  // Enquanto verifica, não mostra nada (evita flash)
  if (isChecking) {
    return null;
  }

  // Se não é permitido, mostra tela de bloqueio
  if (!isAllowed) {
    return <BlockedAccess reason={reason} />;
  }

  // Acesso permitido, mostra o Dashboard
  return <Dashboard />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
