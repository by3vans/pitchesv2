import type { Metadata } from 'next';
import { Suspense } from 'react';
import PitchDetailInteractive from './components/PitchDetailInteractive';

export const metadata: Metadata = {
  title: 'Detalhes do Pitch - PitchManager',
  description: 'Visualize e gerencie informações detalhadas, notas e status de pitches musicais de artistas.',
};

export default function PitchDetailManagementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-gray-400 text-sm">Carregando...</span></div>}>
      <PitchDetailInteractive />
    </Suspense>
  );
}