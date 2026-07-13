const WebSocket = require("ws");

let ws = null;
let latestPrice = null;
let subscribers = [];

function connect() {
  ws = new WebSocket(`wss://ws.finnhub.io?token=${process.env.FINNHUB_KEY}`);

  ws.on("open", () => {
    console.log("✅ Finnhub WebSocket connected");
    ws.send(JSON.stringify({ type: "subscribe", symbol: "OANDA:XAU_USD" }));
    ws.send(JSON.stringify({ type: "subscribe", symbol: "XAU/USD" }));
    ws.send(JSON.stringify({ type: "subscribe", symbol: "FXCM:XAU/USD" }));
  });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === "trade" && msg.data?.length > 0) {
        const tick = msg.data[msg.data.length - 1];
        latestPrice = {
          price: tick.p,
          time: tick.t,
          volume: tick.v,
        };
        // ส่งให้ทุก subscriber
        subscribers.forEach((fn) => fn(latestPrice));
      }
    } catch (err) {
      console.error("Finnhub message error:", err);
    }
  });

  ws.on("close", () => {
    console.log("⚠️ Finnhub WebSocket closed — reconnecting in 5s...");
    setTimeout(connect, 5000);
  });

  ws.on("error", (err) => {
    console.error("Finnhub WebSocket error:", err.message);
  });
}

function subscribe(fn) {
  subscribers.push(fn);
  return () => {
    subscribers = subscribers.filter((s) => s !== fn);
  };
}

function getLatestPrice() {
  return latestPrice;
}

module.exports = { connect, subscribe, getLatestPrice };
