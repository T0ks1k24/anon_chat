type MessageHandler = (data: Record<string, any>) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private messageHandlers: MessageHandler[] = [];
  private token: string | null = null;
  private room: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private autoReconnect: boolean = true;

  constructor(url: string) {
    this.url = url;
  }

  connect(token: string, room: string = "general") {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.room === room) return;
    
    if (this.socket) {
      this.disconnect();
    }

    this.token = token;
    this.room = room;
    this.autoReconnect = true;
    
    const baseUrl = this.url.endsWith('/') ? this.url : `${this.url}/`;
    const wsUrl = `${baseUrl}${room}/?token=${token}`;
    
    console.log(`Connecting to WS: ${wsUrl}`);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log(`WebSocket connected to room: ${room}`);
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "pong") return;
        this.messageHandlers.forEach(handler => handler(data));
      } catch (e) {
        console.error("Invalid WS message", e);
      }
    };

    this.socket.onclose = () => {
      console.log("WebSocket disconnected");
      this.socket = null;
      if (this.autoReconnect && this.token && this.room) {
        this.reconnectTimer = setTimeout(() => {
          this.connect(this.token!, this.room!);
        }, 3000);
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error", error);
    };
  }

  disconnect() {
    this.autoReconnect = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  sendMessage(message: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ message }));
    } else {
      console.error("WebSocket not ready");
    }
  }

  sendPing() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "ping" }));
    }
  }
}

export const chatService = new WebSocketService(
  process.env.NEXT_PUBLIC_WS_URL || 
  (typeof window !== "undefined" ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat/` : "ws://localhost/ws/chat/")
);
