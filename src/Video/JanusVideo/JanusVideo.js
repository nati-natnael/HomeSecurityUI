import React, { useState, useEffect, useRef } from "react";
import { Card, Container, Row, Col } from "react-bootstrap";
import "./JanusVideo.css";
import noVideoImg from "./no-video.png";
import noVideoTvStatic from "./tv-static.gif";

const RequestType = {
  NONE: 0,
  CREATE: 1,
  PRE_ATTACH: 2,
  ATTACH: 3,
  LIST: 4,
  WATCH: 5,
};

const initialWebsocketData = {
  websocket: null,
  connected: false,
};

const initialSessionData = {
  session: null,
  tempPlugin: null,
  streamData: {
    count: 0,
    streams: [],
  },
};

const JanusVideo = (props) => {
  const keepAliveHandle = useRef(null);
  const prevWebsocketData = useRef(null);
  const prevSessionData = useRef(null);

  const [requestType, setRequestType] = useState(RequestType.NONE);
  const [websocketData, setWebsocketData] = useState(initialWebsocketData);
  const [sessionData, setSessionData] = useState(initialSessionData);

  if (websocketData.websocket) {
    websocketData.websocket.onopen = () => {
      setWebsocketData({ ...websocketData, connected: true });
    };

    websocketData.websocket.onclose = () => {
      setWebsocketData({ ...websocketData, connected: false });
    };

    websocketData.websocket.onerror = () => {};

    websocketData.websocket.onmessage = async (event) => {
      const janusData = JSON.parse(event.data);

      switch (janusData["janus"]) {
        case "success":
          switch (requestType) {
            case RequestType.CREATE:
              setSessionData({ ...sessionData, session: janusData.data.id });
              break;

            case RequestType.PRE_ATTACH:
              setSessionData({
                ...sessionData,
                tempPlugin: janusData.data.id,
              });
              break;

            case RequestType.ATTACH:
              const newStreamData = { ...sessionData.streamData };
              for (const stream of newStreamData.streams) {
                if (`${stream.id}` === janusData.transaction) {
                  stream.handle = janusData.data.id;
                }
              }

              setSessionData({ ...sessionData, streamData: newStreamData });
              break;

            case RequestType.LIST:
              setSessionData({
                ...sessionData,
                streamData: {
                  count: janusData.plugindata.data.list.length,
                  streams: janusData.plugindata.data.list.map((data) => {
                    return {
                      handle: null,
                      id: data.id,
                      type: data.type,
                      description: data.description,
                      rtcPeerConnection: null,
                      pluginAttachRequested: false,
                      watchRequested: false,
                    };
                  }),
                },
              });

              setRequestType(RequestType.WATCH);
              break;

            default:
              break;
          }
          break;

        case "event":
          switch (janusData?.plugindata?.data?.result?.status) {
            case "preparing":
              const newStreamData = { ...sessionData.streamData };
              for (const stream of newStreamData.streams) {
                if (`${stream.id}` === janusData.transaction) {
                  if (!stream.rtcPeerConnection) {
                    stream.rtcPeerConnection = new RTCPeerConnection(
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
                  }

                  stream.rtcPeerConnection.ontrack = (event) => {
                    const remoteVidElem = document.getElementById(
                      `remotevideo_${stream.id}`
                    );

                    if (event.streams[0]) {
                      remoteVidElem.srcObject = event.streams[0];
                    }
                  };

                  stream.rtcPeerConnection
                    .setRemoteDescription(janusData.jsep)
                    .then(() => {
                      stream.rtcPeerConnection
                        .createAnswer({})
                        .then((answer) => {
                          stream.rtcPeerConnection
                            .setLocalDescription(answer)
                            .catch((err) => console.log(err));

                          startStream(
                            websocketData.websocket,
                            sessionData.session,
                            stream.handle,
                            answer
                          );
                        });
                    });
                  break;
                }
              }
              break;

            case "starting":
            case "started":
            default:
              break;
          }
          break;

        case "keepalive":
        case "ack":
        case "trickle":
        case "webrtcup":
        case "hangup":
        case "detached":
        case "media":
        case "error":
        case "timeout":
        default:
          break;
      }
    };
  }

  useEffect(() => {
    return () => {
      unmount();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const server = `ws://${props.ip}:${props.port}`;
    const newConnection = new WebSocket(server, props.protocol);
    setWebsocketData({ websocket: newConnection, connected: false });
  }, [props]);

  useEffect(() => {
    prevWebsocketData.current = websocketData;
    prevSessionData.current = sessionData;
  }, [websocketData, sessionData]);

  useEffect(() => {
    if (websocketData.connected) {
      createSession(websocketData.websocket);
      setRequestType(RequestType.CREATE);
    }
  }, [websocketData]);

  useEffect(() => {
    if (websocketData.connected && sessionData.session) {
      attachToStreamingPlugin(websocketData.websocket, sessionData.session);
      setRequestType(RequestType.PRE_ATTACH);
    }
  }, [websocketData, sessionData.session]);

  useEffect(() => {
    if (websocketData.connected && sessionData.streamData.count > 0) {
      let updateSessionData = false;
      const newStreamData = { ...sessionData.streamData };
      for (const stream of sessionData.streamData.streams) {
        if (!stream.handle && !stream.pluginAttachRequested) {
          updateSessionData = true;
          stream.pluginAttachRequested = true;
          attachToStreamingPlugin(
            websocketData.websocket,
            sessionData.session,
            stream.id
          );
        }
      }

      if (updateSessionData) {
        setRequestType(RequestType.ATTACH);
        setSessionData({ ...sessionData, streamData: newStreamData });
      }
    }
  }, [websocketData, sessionData, sessionData.streamData]);

  useEffect(() => {
    if (websocketData.connected && sessionData.tempPlugin) {
      getStreamList(
        websocketData.websocket,
        sessionData.session,
        sessionData.tempPlugin
      );

      setRequestType(RequestType.LIST);
    }
  }, [websocketData, sessionData.session, sessionData.tempPlugin]);

  useEffect(() => {
    if (websocketData.connected && sessionData.streamData.streams) {
      let updateSessionData = false;
      const newStreamData = { ...sessionData.streamData };
      for (const stream of newStreamData.streams) {
        if (stream.handle && !stream.watchRequested) {
          updateSessionData = true;
          stream.watchRequested = true;

          requestWatch(
            websocketData.websocket,
            sessionData.session,
            stream.handle,
            stream.id
          );
        }
      }

      if (updateSessionData) {
        setSessionData({ ...sessionData, streamData: newStreamData });
      }
    }
  }, [websocketData, sessionData, sessionData.streamData]);

  const createSession = (webSocketConn) => {
    webSocketConn.send(
      JSON.stringify({ janus: "create", transaction: "janus" })
    );
  };

  const destroySession = (webSocketConn) => {
    webSocketConn.send(
      JSON.stringify({ janus: "destroy", transaction: "janus" })
    );
  };

  const attachToStreamingPlugin = (webSocketConn, sessionId, transaction) => {
    webSocketConn.send(
      JSON.stringify({
        janus: "attach",
        session_id: sessionId,
        plugin: "janus.plugin.streaming",
        transaction: transaction ? `${transaction}` : "janus",
      })
    );
  };

  const detachToStreamingPlugin = (webSocketConn, sessId, handleId) => {
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

  const getStreamList = (webSocketConn, sessId, handleId) => {
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

  const requestWatch = (webSocketConn, sessId, handleId, streamIndex) => {
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

  const startStream = (webSocketConn, sessId, handleId, answer) => {
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

  const stopStream = (webSocketConn, sessId, handleId) => {
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

  const unmount = () => {
    const webSockData = prevWebsocketData.current;
    const sessData = prevSessionData.current;

    clearInterval(keepAliveHandle.current);

    if (webSockData.websocket.readyState === WebSocket.CLOSED) {
      if (sessData.tempPlugin) {
        detachToStreamingPlugin(
          webSockData.websocket,
          sessData.session,
          sessData.tempPlugin
        );
      }

      for (const stream of sessData.streamData.streams) {
        if (stream.handle && stream.pluginAttachRequested) {
          stopStream(webSockData.websocket, sessData.session, stream.handle);

          stream.rtcPeerConnection.close();

          detachToStreamingPlugin(
            webSockData.websocket,
            sessData.session,
            stream.handle
          );
        }
      }

      if (sessionData.session) {
        destroySession(webSockData.websocket, sessionData.session);
      }

      webSockData.websocket.close();
    }
  };

  const renderVideos = () => {
    const videoComponents = [];

    if (sessionData.streamData.streams.length > 0) {
      const rowCount = Math.ceil(
        Math.sqrt(sessionData.streamData.streams.length + 1)
      );

      for (let i = 0; i < rowCount; i++) {
        const cols = [];
        for (let j = i * rowCount; j < rowCount * (i + 1); j++) {
          const stream = sessionData.streamData.streams[j];

          if (stream) {
            cols.push(
              <Col lg>
                <video
                  key={stream.id}
                  id={`remotevideo_${stream.id}`}
                  poster={noVideoImg}
                  width="320"
                  autoPlay
                  muted="muted"
                  playsInline
                />
              </Col>
            );
          }
        }

        videoComponents.push(<Row>{cols}</Row>);
      }
    }

    return videoComponents;
  };

  const render = () => {
    if (websocketData.connected) {
      return <Container>{renderVideos()}</Container>;
    } else {
      return (
        <Card>
          <Card.Img src={noVideoTvStatic} />
        </Card>
      );
    }
  };

  return <div className="stream-content">{render()}</div>;
};

export default JanusVideo;
