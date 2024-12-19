class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.subscribers = new Map();
    this.isConnecting = false;
    this.messageQueue = [];

    // URLの構築（シンプルに戻す）
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const port = import.meta.env.DEV ? '5173' : window.location.port;
    this.url = `${protocol}//${host}:${port}`;

    this.connect();

    // ページのvisibility変更を監視
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.isConnected()) {
        this.connect();
      }
    });
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  connect() {
    if (this.isConnecting || this.isConnected()) return;
    
    this.isConnecting = true;
    console.log(`Attempting to connect to WebSocket at ${this.url}`);

    try {
      this.ws = new WebSocket(this.url);

      // 接続タイムアウトの設定
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          console.log('Connection timeout, closing socket');
          this.cleanup();
        }
      }, 3000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.processMessageQueue();
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`WebSocket closed with code ${event.code}:`, event.reason);
        this.cleanup();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.cleanup();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifySubscribers(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.cleanup();
      this.attemptReconnect();
    }
  }

  cleanup() {
    this.isConnecting = false;
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      
      try {
        this.ws.close();
      } catch (error) {
        console.error('Error while closing WebSocket:', error);
      }
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = 1000; // 固定の1秒遅延に変更
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
      setTimeout(() => {
        if (!this.isConnected()) {
          this.connect();
        }
      }, delay);
    } else {
      console.error('Maximum reconnection attempts reached');
    }
  }

  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type).add(callback);

    return () => {
      const callbacks = this.subscribers.get(type);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  notifySubscribers(data) {
    const { type, payload } = data;
    const callbacks = this.subscribers.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  sendMessage(type, payload = {}) {
    const message = { type, payload };
    
    if (this.isConnected()) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        this.messageQueue.push(message);
        return false;
      }
    } else {
      this.messageQueue.push(message);
      if (!this.isConnecting) {
        this.connect();
      }
      return false;
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send queued message:', error);
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  disconnect() {
    this.cleanup();
  }
}

export const websocketService = new WebSocketService();
export default websocketService;