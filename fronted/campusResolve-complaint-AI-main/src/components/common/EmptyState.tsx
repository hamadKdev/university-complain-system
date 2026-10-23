import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#0a1024]/60 border border-white/10 my-4">
      <div className="w-12 h-12 rounded-2xl bg-[#182444] flex items-center justify-center text-cyan-300 mb-4 border border-cyan-500/20 shadow-sm shadow-cyan-500/10">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs sm:text-sm text-[#8c9fc2] max-w-sm leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-4 py-2 text-xs font-bold text-[#090e21] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl hover:from-cyan-300 hover:to-blue-400 transition-all whitespace-nowrap shadow-md shadow-cyan-500/20 active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
