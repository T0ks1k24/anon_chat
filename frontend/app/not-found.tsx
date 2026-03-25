import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center relative overflow-hidden">
      {/* Matrix Background Effect */}
      <div 
        className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.2) 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }}
      ></div>
      
      <div className="z-10 flex flex-col items-center text-center p-8 border border-green-900 bg-black/60 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,0,0.1)]">
        <h1 className="text-6xl font-bold mb-4 tracking-widest text-green-400 drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">
          404
        </h1>
        
        <div className="w-full h-px bg-green-900 mb-6"></div>
        
        <h2 className="text-xl mb-2 tracking-[0.2em] uppercase font-bold text-green-500">
          <span className="text-red-500 mr-2">[ERROR]</span> 
          ENDPOINT_NOT_FOUND
        </h2>
        
        <p className="text-sm text-green-700 mb-8 max-w-md lowercase opacity-80">
          &gt; The requested secure node could not be located in the current network topology. The connection attempt has been logged and terminated.
        </p>
        
        <Link 
          href="/" 
          className="px-6 py-3 font-bold border border-green-700 bg-green-950/50 text-green-400 hover:bg-green-900 hover:text-green-300 transition-all uppercase tracking-widest text-xs group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center">
            <span className="mr-2 opacity-50 group-hover:opacity-100">&lt;</span>
            Return to secure channel
          </span>
          {/* Scanline hover effect */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-green-400 opacity-0 group-hover:animate-[scanline_1s_infinite]"></div>
        </Link>
      </div>

      <div className="absolute bottom-4 left-4 text-[10px] text-green-900 uppercase tracking-widest">
        STATUS: <span className="text-red-900 animate-pulse">OFFLINE</span>
      </div>
      <div className="absolute bottom-4 right-4 text-[10px] text-green-900 uppercase tracking-widest">
        SYS_ERR_CODE: 0x00000404
      </div>

      <style jsx>{`
        @keyframes scanline {
          0% { top: 0; opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
