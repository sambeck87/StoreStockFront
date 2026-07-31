import { Check, X } from 'lucide-react';

export function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  );
}
