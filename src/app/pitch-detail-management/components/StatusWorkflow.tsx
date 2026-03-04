
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
    <div className="p-5 rounded-xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>Fluxo de Status</p>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
        {steps.map((step, idx) => (
          <div key={step.status} className="flex sm:flex-1 items-center gap-2 sm:gap-0">
            <div className="flex flex-col items-center sm:flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                step.active
                  ? 'border-foreground bg-foreground'
                  : step.completed
                  ? 'border-emerald-500 bg-emerald-500' :'border-muted-foreground/30 bg-white'
              }`}>
                {step.completed && !step.active ? (
                  <Icon name="CheckIcon" size={14} variant="solid" className="text-white" />
                ) : step.active ? (
                  <span className="w-2 h-2 rounded-full bg-white" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <p className={`text-xs mt-1.5 font-medium text-center ${step.active ? 'text-foreground' : step.completed ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
              {step.timestamp && (
                <p className="text-xs text-muted-foreground mt-0.5 text-center hidden sm:block">{step.timestamp}</p>
              )}
            </div>
            {idx < steps.length - 1 && (
              <div className={`hidden sm:block h-0.5 flex-1 mx-1 rounded-full ${step.completed ? 'bg-emerald-400' : 'bg-muted-foreground/20'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}