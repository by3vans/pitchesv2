import { Suspense } from 'react';
import PitchDetailInteractive from '../../pitch-detail-management/components/PitchDetailInteractive';

export default function PitchDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-gray-400 text-sm">Loading...</span></div>}>
      <PitchDetailInteractive />
    </Suspense>
  );
}
