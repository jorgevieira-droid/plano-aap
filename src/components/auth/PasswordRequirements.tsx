import { Check, X } from 'lucide-react';
import { validatePassword, getPasswordStrength } from '@/lib/passwordValidation';
import { cn } from '@/lib/utils';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
  const { requirements } = validatePassword(password);
  const strength = getPasswordStrength(password);

  const requirementsList = [
    { key: 'minLength', label: 'Mínimo de 9 caracteres', met: requirements.minLength },
    { key: 'hasUppercase', label: 'Uma letra maiúscula', met: requirements.hasUppercase },
    { key: 'hasLowercase', label: 'Uma letra minúscula', met: requirements.hasLowercase },
    { key: 'hasNumber', label: 'Um número', met: requirements.hasNumber },
    { key: 'hasSpecialChar', label: 'Um caractere especial (!@#$...)', met: requirements.hasSpecialChar },
    { key: 'notCommon', label: 'Senha não comum', met: requirements.notCommon },
  ];

  const strengthColors = {
    weak: 'bg-destructive',
    medium: 'bg-warning',
    strong: 'bg-green-500',
  };

  const strengthLabels = {
    weak: 'Fraca',
    medium: 'Média',
    strong: 'Forte',
  };

  const strengthWidth = {
    weak: 'w-1/3',
    medium: 'w-2/3',
    strong: 'w-full',
  };

  return (
    <div className={cn("bg-muted/50 p-3 rounded-lg text-sm", className)}>
      {password && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted-foreground">Força da senha:</span>
            <span className={cn(
              "font-medium",
              strength === 'weak' && 'text-destructive',
              strength === 'medium' && 'text-warning',
              strength === 'strong' && 'text-green-600'
            )}>
              {strengthLabels[strength]}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300",
                strengthColors[strength],
                strengthWidth[strength]
              )}
            />
          </div>
        </div>
      )}
      
      <p className="font-medium mb-2 text-muted-foreground">Requisitos da senha:</p>
      <ul className="space-y-1">
        {requirementsList.map((req) => (
          <li 
            key={req.key}
            className={cn(
              "flex items-center gap-2 transition-colors",
              req.met ? 'text-green-600' : 'text-muted-foreground'
            )}
          >
            {req.met ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <X className="w-4 h-4 shrink-0" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
