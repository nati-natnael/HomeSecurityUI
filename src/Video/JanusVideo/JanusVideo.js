import React, { useState } from "react";
import { Card, Button } from "react-bootstrap";
import { RequestType } from "./janus_constants";
import styles from "./JanusVideo.css";
import noVideoImg from "./no-video.png";

const server = "ws://192.168.0.8:8188";
const protocol = "janus-protocol";
const websocket = new WebSocket(server, protocol);

let requestType = RequestType.NONE;
let sessionId = null;
let pluginId = null;

websocket.onerror = (event) => {
  console.log("connection error");
};

const JanusVideo = () => {
  const [connected, setConnected] = useState(false);
  const [streamList, setStreamList] = useState([]);
  const [playing, setPlaying] = useState(false);

  let selectedStream = null;

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

  websocket.onopen = (event) => {
    setConnected(true);
    console.log("inside on open");
  };

  websocket.onclose = (event) => {
    setConnected(false);
  };

  websocket.onmessage = async (event) => {
    const janusData = JSON.parse(event.data);

    switch (janusData["janus"]) {
      case "keepalive":
        break;

      case "ack":
        break;

      case "success":
        switch (requestType) {
          case RequestType.CREATE:
            sessionId = janusData.data.id;
            attachToStreamingPlugin(websocket, sessionId);
            requestType = RequestType.ATTACH;
            break;

          case RequestType.ATTACH:
            pluginId = janusData.data.id;
            getStreamList(websocket, sessionId, pluginId);
            requestType = RequestType.LIST;
            break;

          case RequestType.LIST:
            if (streamList.length === 0) {
              setStreamList(
                janusData.plugindata.data.list.map((data) => {
                  return { id: data.id, name: data.description };
                })
              );
            }

            requestType = RequestType.NONE;
            break;

          case RequestType.WATCH:
            break;

          default:
            break;
        }
        break;

      case "trickle":
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
              remoteVidElem.srcObject = event.streams[0];
            };

            rtcPeerConnection.setRemoteDescription(janusData.jsep).then(() => {
              rtcPeerConnection.createAnswer({}).then((answer) => {
                rtcPeerConnection
                  .setLocalDescription(answer)
                  .catch((err) => console.log(err));

                startStream(websocket, sessionId, pluginId, answer);
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

  const handlePlay = () => {
    requestWatch(websocket, sessionId, pluginId, selectedStream);
  };

  const handleStop = () => {
    stopStream(websocket, sessionId, pluginId);
  };

  const onConnect = () => {
    if (connected) {
      if (!sessionId) {
        createSession(websocket);
        requestType = RequestType.CREATE;
      }

      return (
        <div className={styles.streamContent}>
          <Card border="primary">
            <Card.Header>
              <form>
                <select
                  onChange={(event) => {
                    selectedStream = event.target.value;
                  }}
                >
                  <option value="0">None</option>
                  {streamList.map((stream, index) => (
                    <option key={index} value={stream.id}>
                      {stream.name}
                    </option>
                  ))}
                </select>
              </form>
            </Card.Header>
            <Card.Body>
              {playing ? (
                <video id="remotevideo" width="360" autoPlay playsInline />
              ) : (
                <Card.Img src={noVideoImg} />
              )}
            </Card.Body>
            <Card.Footer>
              <Button variant="primary" onClick={handlePlay}>
                Play
              </Button>{" "}
              <Button variant="secondary" onClick={handleStop}>
                Stop
              </Button>
            </Card.Footer>
          </Card>
        </div>
      );
    } else {
      return <>Not connected</>;
    }
  };

  return <div className="stream-content">{onConnect()}</div>;
};

export default JanusVideo;
