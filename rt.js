// CASES Realtime WebSocket Client (rt.js)
// High-performance real-time engine for instant DMs, multiplayer lobbies, chat, and live feeds

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
  var pendingActions = new Map();

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
    }, intervalMs || 20000);
  }

  function scheduleReconnect() {
    stopHeartbeat();
    isAuth = false;
    if (reconnectTimer) return;
    var delay = Math.min(600 * Math.pow(1.3, retryCount), 8000);
    retryCount++;
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
      console.warn("[RT] WebSocket error:", e);
      scheduleReconnect();
      return;
    }

    ws.onopen = function() {
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
        startHeartbeat(msg.heartbeatMs ? Math.max(10000, msg.heartbeatMs - 5000) : 20000);
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
          // Auto-subscribe to global and personal DM room
          send({ type: "sub", room: "global" });
          if (credentials && credentials.username) {
            send({ type: "sub", room: "dm:" + credentials.username.toLowerCase() });
          }
          // Re-subscribe to any active rooms (e.g. current lobby)
          joinedRooms.forEach(function(room) {
            if (room !== "global") {
              send({ type: "sub", room: room });
            }
          });
          emit("auth_ok", msg);
        } else {
          isAuth = false;
          console.warn("[RT] Auth failed:", msg.error);
          emit("auth_fail", msg);
        }
        return;
      }

      // 3. Sub acknowledgement
      if (msg.t === "subbed") {
        return;
      }

      // 4. Action RPC response (ack)
      if (msg.t === "ack" && msg.id && pendingActions.has(msg.id)) {
        var actionCb = pendingActions.get(msg.id);
        pendingActions.delete(msg.id);
        if (actionCb) actionCb(msg.data, msg.status);
        return;
      }

      // 5. Server pushed event
      if (msg.t === "push" && msg.kind) {
        if (msg.kind === "dm") {
          if (msg.data && msg.data.from_user && msg.data.from_user !== "undefined") {
            emit("dm", msg.data);
          }
          return;
        }
        if (msg.data !== undefined) {
          emit(msg.kind, msg.data);
        }
        return;
      }

      // 6. Direct DM payload
      if (msg.t === "dm") {
        if (msg.data && msg.data.from_user && msg.data.from_user !== "undefined") {
          emit("dm", msg.data);
        } else if (msg.from_user && msg.from_user !== "undefined") {
          emit("dm", msg);
        }
        return;
      }

      // 7. Pong / general
      if (msg.t === "pong") {
        return;
      }

      // Generic message dispatch
      emit("message", msg);
    };

    ws.onerror = function(err) {
      emit("error", err);
    };

    ws.onclose = function(e) {
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
      } else if (ws.readyState === WebSocket.OPEN) {
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
        send({ type: "sub", room: room });
      }
    },

    leave: function(room) {
      if (!room) return;
      joinedRooms.delete(room);
      if (ws && ws.readyState === WebSocket.OPEN) {
        send({ type: "unsub", room: room });
      }
    },

    // Fast RPC over WebSocket with automatic HTTP fallback
    action: function(path, body, timeoutMs) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!self.isLive()) {
          // Socket not active, resolve immediately via window.api
          if (typeof window.api === "function") {
            return window.api(path, body).then(resolve).catch(reject);
          }
          return reject(new Error("RT socket and api unavailable"));
        }

        var id = "act_" + Math.random().toString(36).slice(2, 10);
        var timer = setTimeout(function() {
          if (pendingActions.has(id)) {
            pendingActions.delete(id);
            // Timeout fallback to standard HTTP API
            if (typeof window.api === "function") {
              window.api(path, body).then(resolve).catch(reject);
            } else {
              reject(new Error("Socket action timeout"));
            }
          }
        }, timeoutMs || 2500);

        pendingActions.set(id, function(data, status) {
          clearTimeout(timer);
          if (status >= 200 && status < 300) {
            resolve(data);
          } else {
            resolve(data || { error: "Action error " + status });
          }
        });

        var sent = send({
          type: "action",
          path: path,
          body: body || {},
          id: id
        });

        if (!sent) {
          clearTimeout(timer);
          pendingActions.delete(id);
          if (typeof window.api === "function") {
            window.api(path, body).then(resolve).catch(reject);
          } else {
            reject(new Error("Send failed"));
          }
        }
      });
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
