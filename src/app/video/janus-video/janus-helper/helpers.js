export const createSession = (webSocketConn) => {
  webSocketConn.send(JSON.stringify({ janus: "create", transaction: "janus" }));
};

export const destroySession = (webSocketConn) => {
  webSocketConn.send(
    JSON.stringify({ janus: "destroy", transaction: "janus" })
  );
};

export const attachToStreamingPlugin = (
  webSocketConn,
  sessionId,
  transaction
) => {
  webSocketConn.send(
    JSON.stringify({
      janus: "attach",
      session_id: sessionId,
      plugin: "janus.plugin.streaming",
      transaction: transaction ? `${transaction}` : "janus",
    })
  );
};

export const detachFromStreamingPlugin = (webSocketConn, sessId, handleId) => {
  webSocketConn.send(
    JSON.stringify({
      janus: "message",
      session_id: sessId,
      handle_id: handleId,
      transaction: "janus",
      body: {
        request: "detach",
      },
    })
  );
};

export const getStreamList = (webSocketConn, sessId, handleId) => {
  webSocketConn.send(
    JSON.stringify({
      janus: "message",
      session_id: sessId,
      handle_id: handleId,
      transaction: "janus",
      body: {
        request: "list",
      },
    })
  );
};

export const requestWatch = (webSocketConn, sessId, handleId, streamIndex) => {
  webSocketConn.send(
    JSON.stringify({
      janus: "message",
      session_id: sessId,
      handle_id: handleId,
      transaction: streamIndex ? `${streamIndex}` : "janus",
      body: {
        request: "watch",
        id: parseInt(streamIndex),
      },
    })
  );
};

export const startStream = (
  keepAliveHandle,
  webSocketConn,
  sessId,
  handleId,
  answer
) => {
  keepAliveHandle.current = setInterval(() => {
    webSocketConn.send(
      JSON.stringify({
        janus: "keepalive",
        session_id: sessId,
        transaction: "janus",
      })
    );
  }, 60000);

  webSocketConn.send(
    JSON.stringify({
      janus: "message",
      session_id: sessId,
      handle_id: handleId,
      transaction: "janus",
      body: {
        request: "start",
      },
      jsep: {
        type: answer.type,
        sdp: answer.sdp,
      },
    })
  );
};

export const stopStream = (webSocketConn, sessId, handleId) => {
  webSocketConn.send(
    JSON.stringify({
      janus: "message",
      session_id: sessId,
      handle_id: handleId,
      transaction: "janus",
      body: {
        request: "stop",
      },
    })
  );
};
