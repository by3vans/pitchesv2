import type { Metadata } from 'next';
import PitchesInteractive from './components/PitchesInteractive';

export const metadata: Metadata = {
  title: 'Pitches - PitchManager',
  description: 'Gerencie e acompanhe todos os pitches de artistas em um painel centralizado com filtros e busca avançada.',
};

export default function PitchesListingDashboardPage() {
  return <PitchesInteractive />;
}