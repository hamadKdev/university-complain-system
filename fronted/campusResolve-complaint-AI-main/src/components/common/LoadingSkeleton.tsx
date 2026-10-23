import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="space-y-3 w-full animate-pulse my-4">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-16 rounded-2xl bg-[#0a1024]/60 border border-white/5 flex items-center px-4 gap-4"
        >
          <div className="w-9 h-9 rounded-xl bg-[#182444]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 bg-[#182444] rounded-md" />
            <div className="h-2 w-1/2 bg-[#182444]/60 rounded-md" />
          </div>
          <div className="w-20 h-4 bg-[#182444] rounded-md hidden sm:block" />
          <div className="w-16 h-4 bg-[#182444] rounded-md" />
        </div>
      ))}
    </div>
  );
};
