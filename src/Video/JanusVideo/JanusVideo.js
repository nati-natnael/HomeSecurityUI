import React, { useState, useEffect } from "react";
import { Card, ListGroup } from "react-bootstrap";
import { RequestType } from "./janus_constants";
import styles from "./JanusVideo.css";
import noVideoImg from "./no-video.png";
import noVideoTvStatic from "./tv-static.gif";

const JanusVideo = (props) => {
  const [websocketData, setWebsocketData] = useState({
    websocket: null,
    connected: false,
  });

  const [sessionData, setSessionData] = useState({
    session: null,
    tempPlugin: null,
    streamData: {
      count: 0,
      streams: [],
    },
  });

  const [requestType, setRequestType] = useState(RequestType.NONE);
  const [playing, setPlaying] = useState(false);

  let selectedStream = null;
  let keepAliveHandle = null;

  if (websocketData.websocket) {
    websocketData.websocket.onopen = (event) => {
      setWebsocketData({ ...websocketData, connected: true });
      console.log("inside on open");
    };

    websocketData.websocket.onclose = (event) => {
      setWebsocketData({ ...websocketData, connected: false });
    };

    websocketData.websocket.onerror = (event) => {
      console.log("connection error");
    };

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
                if (stream.id == janusData.transaction) {
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
                      watchRequested: false,
                    };
                  }),
                },
              });

              setRequestType(RequestType.WATCH);
              break;

            case RequestType.WATCH:
              break;

            default:
              break;
          }
          break;

        case "event":
          switch (janusData?.plugindata?.data?.result?.status) {
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

              // rtcPeerConnection.ontrack = (event) => {
              //   const remoteVidElem = document.getElementById("remotevideo");
              //   if (event.streams[0]) {
              //     remoteVidElem.srcObject = event.streams[0];
              //   }
              // };

              // rtcPeerConnection
              //   .setRemoteDescription(janusData.jsep)
              //   .then(() => {
              //     rtcPeerConnection.createAnswer({}).then((answer) => {
              //       rtcPeerConnection
              //         .setLocalDescription(answer)
              //         .catch((err) => console.log(err));

              //       startStream(
              //         websocketData.websocket,
              //         sessionId,
              //         pluginId,
              //         answer
              //       );
              //     });
              //   });
              break;

            case "starting":
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
          console.log(janusData);
          break;
      }
    };
  }

  useEffect(() => {
    const server = `ws://${props.ip}:${props.port}`;
    const newConnection = new WebSocket(server, props.protocol);
    setWebsocketData({ websocket: newConnection, connected: false });
  }, [props.ip, props.port, props.protocol]);

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
      for (const stream of sessionData.streamData.streams) {
        attachToStreamingPlugin(
          websocketData.websocket,
          sessionData.session,
          stream.id
        );
      }
      setRequestType(RequestType.ATTACH);
    }
  }, [websocketData, sessionData.session, sessionData.streamData.count]);

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
      let updateState = false;
      const newStreamData = { ...sessionData.streamData };
      for (const stream of newStreamData.streams) {
        if (stream.handle && !stream.watchRequested) {
          updateState = true;
          stream.watchRequested = true;

          requestWatch(
            websocketData.websocket,
            sessionData.session,
            stream.handle,
            stream.id
          );
        }
      }

      if (updateState) {
        setSessionData({ ...sessionData, streamData: newStreamData });
      }
    }
  }, [websocketData, sessionData.session, sessionData.streamData]);

  const createSession = (webSocketConn) => {
    webSocketConn.send(
      JSON.stringify({ janus: "create", transaction: "nati" })
    );
  };

  const attachToStreamingPlugin = (webSocketConn, sessionId, transaction) => {
    webSocketConn.send(
      JSON.stringify({
        janus: "attach",
        session_id: sessionId,
        plugin: "janus.plugin.streaming",
        transaction: transaction ? `${transaction}` : "nati",
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
        transaction: streamIndex ? `${streamIndex}` : "nati",
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

  const stopStream = (webSocketConn, sessId, handleId) => {
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

  const onConnect = () => {
    if (websocketData.connected) {
      return (
        <div className={styles.streamContent}>
          <Card>
            <Card.Body>
              {playing ? (
                <video id="remotevideo" width="360" autoPlay playsInline />
              ) : (
                <Card.Img src={noVideoImg} />
              )}
              {/* <ListGroup variant="flush">
                {sessionData.plugin.streams.map((stream, index) => (
                  <ListGroup.Item key={index} value={stream.id}>
                    {stream.name}
                  </ListGroup.Item>
                ))}
              </ListGroup> */}
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
