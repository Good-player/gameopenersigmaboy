// CASES Realtime WebSocket Client (rt.js)
// Handles persistent connection, heartbeats, auth binding, and event routing

(function() {
  var isGitHub = /\.github\.io$/i.test(location.hostname);
  var isSelfHosted = location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "backend.samptonweb.dpdns.org";
  var DEFAULT_WS_URL = (isGitHub || !isSelfHosted)
    ? "wss://backend.samptonweb.dpdns.org/ws"
    : (location.origin.replace(/^http/, "ws") + "/ws");

  var ws = null;
  var isAuth = false;
  var reconnectTimer = null;
  var pingTimer = null;
  var retryCount = 0;
  var credentials = null;
  var joinedRooms = new Set(["global"]);
  var listeners = {};

  function emit(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(function(cb) {
        try { cb(data); } catch(err) { console.error("[RT] Listener error for", event, err); }
      });
    }
    // Also dispatch on window for React components
    try {
      window.dispatchEvent(new CustomEvent("rt:" + event, { detail: data }));
    } catch(e) {}
  }

  function send(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(typeof obj === "string" ? obj : JSON.stringify(obj));
        return true;
      } catch(e) {
        console.warn("[RT] Send failed:", e);
      }
    }
    return false;
  }

  function stopHeartbeat() {
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
  }

  function startHeartbeat(intervalMs) {
    stopHeartbeat();
    pingTimer = setInterval(function() {
      if (ws && ws.readyState === WebSocket.OPEN) {
        send({ type: "ping" });
      }
    }, intervalMs || 25000);
  }

  function scheduleReconnect() {
    stopHeartbeat();
    isAuth = false;
    if (reconnectTimer) return;
    var delay = Math.min(1000 * Math.pow(1.5, retryCount), 15000);
    retryCount++;
    console.log("[RT] Reconnecting in " + Math.round(delay) + "ms (attempt " + retryCount + ")...");
    reconnectTimer = setTimeout(function() {
      reconnectTimer = null;
      openSocket();
    }, delay);
  }

  function openSocket() {
    if (ws) {
      try { ws.close(); } catch(e) {}
      ws = null;
    }

    try {
      ws = new WebSocket(DEFAULT_WS_URL);
    } catch(e) {
      console.warn("[RT] WebSocket construct error:", e);
      scheduleReconnect();
      return;
    }

    ws.onopen = function() {
      console.log("%c[RT] Connected to " + DEFAULT_WS_URL, "color:#4ade80");
      retryCount = 0;
      emit("connect", {});
    };

    ws.onmessage = function(event) {
      var msg;
      try {
        msg = JSON.parse(event.data);
      } catch(e) {
        return;
      }

      // 1. Initial server hello
      if (msg.t === "hello") {
        startHeartbeat(msg.heartbeatMs ? Math.max(10000, msg.heartbeatMs - 5000) : 25000);
        // Authenticate if we have credentials
        if (credentials && credentials.username && credentials.token) {
          send({
            type: "auth",
            username: credentials.username,
            token: credentials.token,
            uid: credentials.uid || ""
          });
        }
        return;
      }

      // 2. Auth response
      if (msg.t === "auth") {
        if (msg.ok) {
          isAuth = true;
          console.log("%c[RT] Authenticated as " + msg.username, "color:#4ade80;font-weight:bold");
          // Rejoin active rooms
          joinedRooms.forEach(function(room) {
            send({ type: "join", room: room });
          });
          emit("auth_ok", msg);
        } else {
          isAuth = false;
          console.warn("[RT] Auth failed:", msg.error);
          emit("auth_fail", msg);
        }
        return;
      }

      // 3. Server pushed event
      if (msg.t === "push" && msg.kind) {
        emit(msg.kind, msg.data !== undefined ? msg.data : msg);
        return;
      }

      // 4. Pong / general
      if (msg.t === "pong") {
        return;
      }

      // Generic message dispatch
      emit("message", msg);
    };

    ws.onerror = function(err) {
      console.warn("[RT] Socket error:", err);
      emit("error", err);
    };

    ws.onclose = function(e) {
      console.log("[RT] Socket closed (code " + e.code + ")");
      isAuth = false;
      stopHeartbeat();
      emit("disconnect", e);
      scheduleReconnect();
    };
  }

  // Public RT interface
  window.RT = {
    connect: function(username, token, uid) {
      credentials = { username: username, token: token, uid: uid };
      if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        openSocket();
      } else if (ws.readyState === WebSocket.OPEN && (!isAuth || credentials.username !== username)) {
        send({
          type: "auth",
          username: username,
          token: token,
          uid: uid || ""
        });
      }
    },

    disconnect: function() {
      credentials = null;
      isAuth = false;
      stopHeartbeat();
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      if (ws) {
        try { ws.close(); } catch(e) {}
        ws = null;
      }
    },

    isLive: function() {
      return !!(ws && ws.readyState === WebSocket.OPEN && isAuth);
    },

    isConnected: function() {
      return !!(ws && ws.readyState === WebSocket.OPEN);
    },

    join: function(room) {
      if (!room) return;
      joinedRooms.add(room);
      if (ws && ws.readyState === WebSocket.OPEN) {
        send({ type: "join", room: room });
      }
    },

    leave: function(room) {
      if (!room) return;
      joinedRooms.delete(room);
      if (ws && ws.readyState === WebSocket.OPEN) {
        send({ type: "leave", room: room });
      }
    },

    send: send,

    on: function(event, callback) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
      return function unsubscribe() {
        var idx = listeners[event] ? listeners[event].indexOf(callback) : -1;
        if (idx !== -1) listeners[event].splice(idx, 1);
      };
    },

    off: function(event, callback) {
      if (!listeners[event]) return;
      var idx = listeners[event].indexOf(callback);
      if (idx !== -1) listeners[event].splice(idx, 1);
    }
  };

  // Auto-connect with saved account if available
  try {
    var savedAcct = JSON.parse(localStorage.getItem("co-account"));
    var uid = localStorage.getItem("co-uid") || "";
    if (savedAcct && savedAcct.username && savedAcct.token) {
      window.RT.connect(savedAcct.username, savedAcct.token, uid);
    } else {
      openSocket();
    }
  } catch(e) {
    openSocket();
  }
})();
