"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/utils/api";
import Link from "next/link";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(username, password);
      router.push("/login?registered=1");
    } catch {
      setError("Registration failed. Try a different username.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-green-500 font-mono relative overflow-hidden">
      {/* Decorative matrix-like background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="w-full max-w-md p-8 bg-black bg-opacity-80 rounded-sm border border-green-800 shadow-[0_0_15px_rgba(0,255,0,0.3)] z-10 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
        <h2 className="text-2xl font-bold mb-6 text-center tracking-widest uppercase">&gt; NEW_AGENT_REGISTRATION</h2>
        {error && <p className="mb-4 text-red-500 text-xs animate-pulse">&gt; ERR: {error}</p>}
        
        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div className="flex flex-col">
            <label className="text-xs text-green-700 mb-1">Generate Alias</label>
            <input 
              type="text" 
              placeholder="root..." 
              className="p-3 bg-black border border-green-900 text-green-400 placeholder-green-900 outline-none focus:border-green-500 focus:shadow-[0_0_8px_rgba(0,255,0,0.4)] transition-all"
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-green-700 mb-1">Secure Passphrase</label>
            <input 
              type="password" 
              placeholder="****..." 
              className="p-3 bg-black border border-green-900 text-green-400 placeholder-green-900 outline-none focus:border-green-500 focus:shadow-[0_0_8px_rgba(0,255,0,0.4)] transition-all"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
            />
          </div>
          <button type="submit" className="p-3 mt-4 font-bold border border-green-600 bg-green-950 text-green-400 hover:bg-green-900 hover:text-green-300 transition-all uppercase tracking-wider relative overflow-hidden group">
            <span className="relative z-10">&gt; INITIALIZE_PROFILE</span>
            <div className="absolute inset-0 h-full w-full bg-green-500/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs text-green-700">
          Already have an alias? <Link href="/login" className="text-green-500 hover:text-green-300 hover:underline">Execute_Login</Link>
        </div>
      </div>
    </div>
  );
}
