import Icon from '@/components/ui/AppIcon';

interface WorkflowStep {
  status: 'novo' | 'em_analise' | 'aprovado' | 'rejeitado' | 'pendente' | 'arquivado';
  label: string;
  timestamp?: string;
  completed: boolean;
  active: boolean;
}

interface StatusWorkflowProps {
  steps: WorkflowStep[];
}

export default function StatusWorkflow({ steps }: StatusWorkflowProps) {
  return (
    <div
      className="p-5 rounded-xl border"
      style={{ backgroundColor: 'var(--ice)', borderColor: 'var(--cream)' }}
    >
      <p
        className="text-xs font-medium uppercase tracking-widest mb-4"
        style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}
      >
        Fluxo de Status
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
        {steps.map((step, idx) => (
          <div key={step.status} className="flex sm:flex-1 items-center gap-2 sm:gap-0">
            <div className="flex flex-col items-center sm:flex-1">

              {/* Circle */}
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all"
                style={{
                  borderColor: step.active
                    ? 'var(--ink)'
                    : step.completed
                    ? 'var(--olive)'
                    : 'var(--cream)',
                  backgroundColor: step.active
                    ? 'var(--ink)'
                    : step.completed
                    ? 'var(--olive)'
                    : 'var(--ice)',
                }}
              >
                {step.completed && !step.active ? (
                  <Icon name="CheckIcon" size={14} variant="solid" style={{ color: 'var(--ice)' }} />
                ) : step.active ? (
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--ice)' }} />
                ) : (
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--cream)' }} />
                )}
              </div>

              {/* Label */}
              <p
                className="text-xs mt-1.5 font-medium text-center"
                style={{
                  fontFamily: 'Epilogue, sans-serif',
                  color: step.active
                    ? 'var(--ink)'
                    : step.completed
                    ? 'var(--olive)'
                    : 'var(--stone)',
                }}
              >
                {step.label}
              </p>

              {/* Timestamp */}
              {step.timestamp && (
                <p
                  className="text-xs mt-0.5 text-center hidden sm:block"
                  style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--stone)' }}
                >
                  {step.timestamp}
                </p>
              )}
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className="hidden sm:block h-0.5 flex-1 mx-1 rounded-full"
                style={{ backgroundColor: step.completed ? 'var(--olive)' : 'var(--cream)' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}