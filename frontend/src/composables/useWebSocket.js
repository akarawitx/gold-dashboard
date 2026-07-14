import { ref, onUnmounted } from "vue";

export function useWebSocket() {
  const latestPrice = ref(null);
  const connected = ref(false);
  let ws = null;

  function connect() {
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3001";
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      connected.value = true;
      console.log("✅ Connected to backend WS");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "tick") {
          latestPrice.value = msg.data;
        }
      } catch (err) {
        console.error("WS message error:", err);
      }
    };

    let reconnectTimer = null;

    ws.onclose = () => {
      connected.value = false;
      console.log("⚠️ WS disconnected — reconnecting in 3s...");
      reconnectTimer = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error("WS error:", err);
    };
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) ws.close();
  }

  onUnmounted(disconnect);

  return { latestPrice, connected, connect, disconnect };
}
