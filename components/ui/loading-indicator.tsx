import { BrainCircuit, Loader2 } from "lucide-react";

export const LoadingScreen = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-900 transition-colors duration-500">
    {/* Efek Cahaya Latar Belakang (Ambient) */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
    
    <div className="relative flex flex-col items-center">
      {/* Kontainer Ikon dengan Animasi Halus */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-ping opacity-50" />
        <div className="relative bg-white dark:bg-slate-800 p-5 rounded-full shadow-xl border border-slate-100 dark:border-slate-700">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>

      {/* Konten Teks General */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
          Memuat Aplikasi
        </h2>
        <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold text-[11px] uppercase tracking-[0.2em]">
          Mohon tunggu sebentar
        </div>
      </div>

      {/* Progress Line Minimalis */}
      <div className="mt-8 w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full animate-progress-flow w-1/3 origin-left"
        />
      </div>
    </div>

    <style jsx global>{`
      @keyframes progress-flow {
        0% { transform: translateX(-100%) scaleX(0.5); }
        50% { transform: translateX(100%) scaleX(1.5); }
        100% { transform: translateX(300%) scaleX(0.5); }
      }
      .animate-progress-flow {
        animation: progress-flow 2s infinite ease-in-out;
      }
    `}</style>
  </div>
);