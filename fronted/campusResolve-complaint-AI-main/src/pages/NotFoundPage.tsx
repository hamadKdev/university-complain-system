import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#090e21] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute w-[600px] h-[400px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-md w-full p-8 rounded-3xl dash-card dash-card-glow text-center border border-white/10">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="text-xs font-mono font-semibold text-cyan-400 tracking-widest uppercase">
          404 — Route Not Found
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-3">
          Campus Coordinate Undefined
        </h1>
        <p className="text-xs sm:text-sm text-[#8c9fc2] max-w-sm mx-auto mb-8 leading-relaxed">
          The requested screen does not exist or has been relocated within the CampusResolve AI portal.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#090e21] text-xs font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
