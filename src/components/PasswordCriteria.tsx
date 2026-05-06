import { IconCheck, IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface Criterion {
  label: string;
  met: boolean;
}

interface PasswordCriteriaProps {
  password: string;
  className?: string;
}

export default function PasswordCriteria({ password, className }: PasswordCriteriaProps) {
  if (!password) return null;

  const criteria: Criterion[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className={cn("space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200", className)}>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Security Criteria</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors",
              c.met ? "bg-brand/20 text-brand" : "bg-muted text-muted-foreground"
            )}>
              {c.met ? <IconCheck size={10} stroke={3} /> : <IconX size={10} stroke={3} />}
            </div>
            <span className={cn(
              "text-[11px] transition-colors",
              c.met ? "text-foreground" : "text-muted-foreground"
            )}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
