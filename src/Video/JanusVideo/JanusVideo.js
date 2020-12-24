import React, { useState, useEffect } from "react";
import { Card, Button, ListGroup } from "react-bootstrap";
import { RequestType } from "./janus_constants";
import styles from "./JanusVideo.css";
import noVideoImg from "./no-video.png";
import noVideoTvStatic from "./tv-static.gif";

const server = "ws://192.168.0.8:8188";
const protocol = "janus-protocol";

const JanusVideo = () => {
  const [websocketData, setWebsocketData] = useState({
    websocket: null,
    connected: false,
  });

  const [sessionData, setSessionData] = useState({
    session: null,
    plugin: null,
  });

  const [connected, setConnected] = useState(false);
  const [requestType, setRequestType] = useState(RequestType.NONE);
  const [sessionId, setSessionId] = useState(null);
  const [pluginId, setPluginId] = useState(null);
  const [streamList, setStreamList] = useState([]);
  const [playing, setPlaying] = useState(false);

  let selectedStream = null;
  let keepAliveHandle = null;

  useEffect(() => {
    const newConnection = new WebSocket(server, protocol);
    setWebsocketData({ websocket: newConnection, connected: false });
  }, []);

  useEffect(() => {
    if (websocketData.connected) {
      createSession(websocketData.websocket);
      setRequestType(RequestType.CREATE);
    }
  }, [websocketData]);

  useEffect(() => {
    if (websocketData.connected && sessionData.session) {
      attachToStreamingPlugin(websocketData.websocket, sessionData.session);
      setRequestType(RequestType.ATTACH);
    }
  }, [websocketData, sessionData.session]);

  useEffect(() => {
    if (websocketData.connected && sessionData.session && sessionData.plugin) {
      getStreamList(
        websocketData.websocket,
        sessionData.session,
        sessionData.plugin.handle
      );

      setRequestType(RequestType.LIST);
    }
  }, [
    websocketData,
    sessionData.session,
    sessionData.plugin,
    sessionData.plugin?.handle,
  ]);

  const createSession = (webSocketConn) => {
    webSocketConn.send(
      JSON.stringify({ janus: "create", transaction: "nati" })
    );
  };

  const attachToStreamingPlugin = (webSocketConn, sessionId) => {
    webSocketConn.send(
      JSON.stringify({
        janus: "attach",
        session_id: sessionId,
        plugin: "janus.plugin.streaming",
        transaction: "nati",
      })
    );
  };

  const getStreamList = (webSocketConn, sessId, handleId) => {
    webSocketConn.send(
      JSON.stringify({
        janus: "message",
        session_id: sessId,
        handle_id: handleId,
        transaction: "nati",
        body: {
          request: "list",
        },
      })
    );
  };

  const requestWatch = (webSocketConn, sessId, handleId, streamIndex) => {
    webSocketConn.send(
      JSON.stringify({
        janus: "message",
        session_id: sessId,
        handle_id: handleId,
        transaction: "nati",
        body: {
          request: "watch",
          id: parseInt(streamIndex),
        },
      })
    );
  };

  const startStream = (webSocketConn, sessId, handleId, answer) => {
    keepAliveHandle = setInterval(() => {
      webSocketConn.send(
        JSON.stringify({
          janus: "keepalive",
          session_id: sessId,
          transaction: "nati",
        })
      );
    }, 60000);

    webSocketConn.send(
      JSON.stringify({
        janus: "message",
        session_id: sessId,
        handle_id: handleId,
        transaction: "nati",
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

  const stopStream = (webSocketConn, sessId, handleId, streamIndex) => {
    clearInterval(keepAliveHandle);
    setPlaying(false);
    webSocketConn.send(
      JSON.stringify({
        janus: "message",
        session_id: sessId,
        handle_id: handleId,
        transaction: "nati",
        body: {
          request: "stop",
        },
      })
    );
  };

  if (websocketData.websocket) {
    websocketData.websocket.onopen = (event) => {
      setWebsocketData({ ...websocketData, connected: true });
      console.log("inside on open");
    };

    websocketData.websocket.onclose = (event) => {
      setConnected(false);
    };

    websocketData.websocket.onerror = (event) => {
      console.log("connection error");
    };

    websocketData.websocket.onmessage = async (event) => {
      const janusData = JSON.parse(event.data);

      switch (janusData["janus"]) {
        case "keepalive":
          break;

        case "ack":
          break;

        case "success":
          switch (requestType) {
            case RequestType.CREATE:
              setSessionData({ ...sessionData, session: janusData.data.id });
              break;

            case RequestType.ATTACH:
              setSessionData({
                ...sessionData,
                plugin: { handle: janusData.data.id, streams: [] },
              });
              break;

            case RequestType.LIST:
              setSessionData({
                ...sessionData,
                plugin: {
                  ...sessionData.plugin,
                  streams: janusData.plugindata.data.list.map((data) => {
                    return {
                      id: data.id,
                      type: data.type,
                      description: data.description,
                    };
                  }),
                },
              });
              setRequestType(RequestType.NONE);
              break;

            case RequestType.WATCH:
              break;

            default:
              break;
          }
          break;

        case "trickle":
          console.log(janusData);
          break;

        case "webrtcup":
          break;

        case "hangup":
          break;

        case "detached":
          break;

        case "media":
          break;

        case "error":
          break;

        case "event":
          switch (janusData.plugindata.data.result.status) {
            case "preparing":
              setPlaying(true);

              let rtcPeerConnection = new RTCPeerConnection(
                {
                  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                  iceTransportPolicy: undefined,
                  bundlePolicy: undefined,
                  sdpSemantics: "unified-plan",
                },
                {
                  optional: [{ DtlsSrtpKeyAgreement: true }],
                }
              );

              rtcPeerConnection.ontrack = (event) => {
                const remoteVidElem = document.getElementById("remotevideo");
                if (event.streams[0]) {
                  remoteVidElem.srcObject = event.streams[0];
                }
              };

              rtcPeerConnection
                .setRemoteDescription(janusData.jsep)
                .then(() => {
                  rtcPeerConnection.createAnswer({}).then((answer) => {
                    rtcPeerConnection
                      .setLocalDescription(answer)
                      .catch((err) => console.log(err));

                    startStream(
                      websocketData.websocket,
                      sessionId,
                      pluginId,
                      answer
                    );
                  });
                });
              break;

            case "starting":
              break;

            default:
              break;
          }
          break;

        case "timeout":
          break;

        default:
          break;
      }
    };
  }

  const onConnect = () => {
    if (connected) {
      return (
        <div className={styles.streamContent}>
          <Card>
            <Card.Body>
              {playing ? (
                <video id="remotevideo" width="360" autoPlay playsInline />
              ) : (
                <Card.Img src={noVideoImg} />
              )}
              <ListGroup variant="flush">
                {sessionData?.map((stream, index) => (
                  <ListGroup.Item key={index} value={stream.id}>
                    {stream.name}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </div>
      );
    } else {
      return (
        <Card>
          <Card.Img src={noVideoTvStatic} />
        </Card>
      );
    }
  };

  return <div className="stream-content">{onConnect()}</div>;
};

export default JanusVideo;
