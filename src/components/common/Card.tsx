import type { ReactNode, MouseEvent } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  noPadding?: boolean;
}

export function Card({ title, children, className = '', actions, onClick, noPadding = false }: CardProps) {
  return (
    <div
      className={`bg-[var(--color-surface)] dark:bg-gray-900 rounded-xl border border-[var(--color-border)] dark:border-gray-800 shadow-sm ${className}`}
      onClick={onClick}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] dark:border-gray-800">
          {title && <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-1'}>{children}</div>
    </div>
  );
}
