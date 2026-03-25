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

const ROOMS = ["general", "dev", "hack"];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [activeRoom, setActiveRoom] = useState("general");
  const [isInitializing, setIsInitializing] = useState(true);
  
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

      setIsInitializing(true);
      setMessages([]);
      setOnlineUsers(new Set());

      // Room-specific E2EE key
      const key = await deriveKey(`secret-anon-chat-${activeRoom}`);
      setCryptoKey(key);

      chatService.connect(token, activeRoom);
      
      const unsubscribe = chatService.onMessage(async (data) => {
        if (data.type === "chat_message") {
          try {
            const dec = await decryptMessage(data.message, key);
            setMessages(prev => [...prev, { ...data, message: dec } as Message]);
          } catch (e) {
            console.error("Decryption failed", e);
            setMessages(prev => [...prev, { ...data, message: "[ENCRYPTED_PAYLOAD_UNREADABLE]" } as Message]);
          }
        } else if (data.type === "presence") {
          setOnlineUsers(prev => {
            const next = new Set(prev);
            if (data.status === "online") next.add(data.user);
            else next.delete(data.user);
            return next;
          });
        } else if (data.type === "sync_presence") {
          setOnlineUsers(new Set(data.users));
        }
      });

      setIsInitializing(false);

      return () => {
        unsubscribe();
      };
    };
    init();
  }, [router, username, activeRoom]);

  useEffect(() => {
    const pingInterval = setInterval(() => {
      chatService.sendPing();
    }, 30000);
    return () => clearInterval(pingInterval);
  }, []);

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
    chatService.disconnect();
    logout();
    router.push("/login");
  };

  if (isInitializing) return (
    <div className="min-h-screen bg-black font-mono flex flex-col items-center justify-center text-green-500">
      <div className="text-xl mb-4 animate-pulse">&gt; INITIALIZING_SECURE_CHANNEL: {activeRoom.toUpperCase()}...</div>
      <div className="w-64 h-1 bg-green-900 overflow-hidden relative">
        <div className="absolute top-0 left-0 h-full bg-green-500 animate-[loading_2s_infinite]"></div>
      </div>
      <style jsx>{`
        @keyframes loading {
          0% { left: -100%; width: 100%; }
          100% { left: 100%; width: 100%; }
        }
      `}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col md:flex-row relative overflow-hidden">
      {/* Matrix Background Effect */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-black border-r border-green-900 p-4 flex flex-col z-10 relative shadow-[5px_0_15px_rgba(0,255,0,0.05)]">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-green-900 border-dashed">
          <h1 className="text-xl font-bold tracking-widest uppercase">&gt; ANON_CHAT</h1>
          <button onClick={handleLogout} className="text-xs px-2 py-1 border border-green-800 bg-green-950/30 hover:bg-green-900 hover:text-green-300 transition-colors uppercase">Logout</button>
        </div>

        {/* Room Selector */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-3 flex items-center">
            <span className="w-2 h-2 rounded-sm bg-green-500 mr-2"></span>
            Endpoints
          </h2>
          <div className="flex flex-col gap-2">
            {ROOMS.map(room => (
              <button 
                key={room}
                onClick={() => setActiveRoom(room)}
                className={`text-left p-3 text-sm transition-all border ${activeRoom === room ? "bg-green-900/30 border-green-500 text-green-300 shadow-[0_0_10px_rgba(0,255,0,0.1)]" : "border-green-900 hover:border-green-700 hover:bg-green-950/20 text-green-700"}`}
              >
                <span className="opacity-50 mr-2">#</span>
                {room.toUpperCase()}
                {activeRoom === room && <span className="float-right animate-pulse">●</span>}
              </button>
            ))}
          </div>
        </div>
        
        {/* Online Users */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <h2 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-4 flex items-center">
            <span className="w-2 h-2 rounded-sm bg-green-500 animate-pulse mr-2"></span>
            Agents_In_Room [{onlineUsers.size}]
          </h2>
          <ul className="space-y-3">
            {Array.from(onlineUsers).map(u => (
              <li key={u} className="flex flex-col text-sm border-l-2 border-green-800 pl-2 opacity-80 hover:opacity-100 transition-opacity">
                <span className="text-green-400 font-bold">{u === username ? `${u} [ROOT]` : u}</span>
                <span className="text-[10px] text-green-700 uppercase">{u === username ? "LINK_ACTIVE" : "ENCRYPTED_NODE"}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 pt-4 border-t border-green-900 border-dashed text-[10px] text-green-800">
          <div className="flex justify-between mb-1">
            <span>STATUS:</span>
            <span className="text-green-600">ENCRYPTED</span>
          </div>
          <div className="flex justify-between">
            <span>CONNECTION:</span>
            <span className="text-green-600">ANONYMOUS</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen z-10 bg-black/40 backdrop-blur-sm">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 select-none">
              <div className="text-4xl mb-4">🛡️</div>
              <div className="text-xs tracking-[0.5em] uppercase text-center">Waiting for encrypted traffic...</div>
            </div>
          ) : (
            messages.map((m, i) => {
              const isMe = m.user === username;
              return (
                <div key={i} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] font-mono text-sm leading-relaxed p-3 border-l-2 ${isMe ? "border-green-400 text-green-300 bg-green-950/20" : "border-green-800 text-green-500 bg-black/50"}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-bold text-xs uppercase tracking-tighter">{isMe ? "YOU" : m.user}</span>
                      <span className="text-[10px] text-green-800 font-light">{m.created_at ? new Date(m.created_at).toLocaleTimeString() : ""}</span>
                    </div>
                    <div className="break-words opacity-90 whitespace-pre-wrap">{m.message}</div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} className="h-1" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black border-t border-green-900 shadow-[0_-5px_15px_rgba(0,255,0,0.05)]">
          <form onSubmit={handleSend} className="flex gap-2 relative group">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 font-bold group-focus-within:text-green-400 transition-colors">&gt;</span>
            <input 
              type="text" 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={`Send message to #${activeRoom}...`}
              className="flex-1 pl-8 p-3 bg-black border border-green-800 text-green-400 placeholder-green-900 outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-all font-mono text-sm"
              autoComplete="off"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim()} 
              className="px-6 py-3 font-bold border border-green-700 bg-green-950/50 text-green-400 hover:bg-green-900 hover:text-green-300 disabled:opacity-20 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-xs"
            >
              Send
            </button>
          </form>
          <div className="mt-2 text-[9px] text-green-900 flex justify-between uppercase tracking-widest">
            <span>Room: {activeRoom}</span>
            <span>E2EE_ACTIVE_AES_256_GCM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
