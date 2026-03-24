"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUsername, logout } from "@/utils/api";
import { chatService } from "@/utils/websocket";
import { deriveKey, encryptMessage, decryptMessage } from "@/utils/crypto";

interface Message {
  user: string;
  message: string;
  created_at?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  
  const router = useRouter();
  const username = getUsername();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (!token || !username) {
        router.push("/login");
        return;
      }

      // Hardcode a global password for E2EE room
      const key = await deriveKey("global-secret-anon-chat");
      setCryptoKey(key);

      chatService.connect(token);
      
      const unsubscribe = chatService.onMessage(async (data) => {
        if (data.type === "chat_message") {
          const dec = await decryptMessage(data.message, key);
          setMessages(prev => [...prev, { ...data, message: dec } as Message]);
        } else if (data.type === "presence") {
          setOnlineUsers(prev => {
            const next = new Set(prev);
            if (data.status === "online") next.add(data.user);
            else next.delete(data.user);
            return next;
          });
        }
      });

      const pingInterval = setInterval(() => {
        chatService.sendPing();
      }, 30000);

      setOnlineUsers(prev => new Set(prev).add(username));

      return () => {
        unsubscribe();
        clearInterval(pingInterval);
        chatService.disconnect();
      };
    };
    init();
  }, [router, username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !cryptoKey) return;

    try {
      const enc = await encryptMessage(inputValue, cryptoKey);
      chatService.sendMessage(enc);
      setInputValue("");
    } catch (e) {
      console.error("Encryption failed", e);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!cryptoKey) return <div className="min-h-screen bg-black font-mono flex items-center justify-center text-green-500"><span className="animate-pulse">&gt; INITIALIZING_E2EE_PROTOCOL...</span></div>;

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col md:flex-row relative overflow-hidden">
      {/* Matrix Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="w-full md:w-64 bg-black border-r border-green-900 p-4 flex flex-col z-10 relative shadow-[5px_0_15px_rgba(0,255,0,0.05)]">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-green-900 border-dashed">
          <h1 className="text-xl font-bold tracking-widest uppercase">&gt; ANON_CHAT</h1>
          <button onClick={handleLogout} className="text-xs px-2 py-1 border border-green-800 bg-green-950/30 hover:bg-green-900 hover:text-green-300 transition-colors uppercase">Disconnect</button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <h2 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-4 flex items-center">
            <span className="w-2 h-2 rounded-sm bg-green-500 animate-pulse mr-2"></span>
            Agents_Online [{onlineUsers.size}]
          </h2>
          <ul className="space-y-3">
            {Array.from(onlineUsers).map(u => (
              <li key={u} className="flex flex-col text-sm border-l-2 border-green-800 pl-2 opacity-80 hover:opacity-100 transition-opacity">
                <span className="text-green-400 font-bold">{u === username ? `${u} [ROOT]` : u}</span>
                <span className="text-[10px] text-green-700">{u === username ? "SECURE_LINK_ACTIVE" : "CONNECTED"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen z-10">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 custom-scrollbar">
          {messages.map((m, i) => {
            const isMe = m.user === username;
            return (
              <div key={i} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] md:max-w-[70%] font-mono text-sm leading-relaxed p-3 border-l-2 ${isMe ? "border-green-400 text-green-300 bg-green-950/20" : "border-green-800 text-green-500 bg-black"}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-xs uppercase">{isMe ? "YOU" : m.user}</span>
                    <span className="text-[10px] text-green-800">{m.created_at ? new Date(m.created_at).toLocaleTimeString() : ""}</span>
                  </div>
                  <div className="break-words opacity-90">{m.message}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} className="h-1" />
        </div>

        <div className="p-4 bg-black border-t border-green-900 shadow-[0_-5px_15px_rgba(0,255,0,0.05)]">
          <form onSubmit={handleSend} className="flex gap-2 relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 font-bold">&gt;</span>
            <input 
              type="text" 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Inject payload..." 
              className="flex-1 pl-8 p-3 bg-black border border-green-800 text-green-400 placeholder-green-800 outline-none focus:border-green-400 focus:shadow-[0_0_10px_rgba(0,255,0,0.2)] transition-all font-mono"
            />
            <button type="submit" disabled={!inputValue.trim()} className="px-6 py-3 font-bold border border-green-700 bg-green-950 text-green-400 hover:bg-green-900 hover:text-green-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors uppercase tracking-widest">
              Execute
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
