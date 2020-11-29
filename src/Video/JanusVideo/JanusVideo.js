import React, { useState } from "react";
import { RequestType } from "./janus_constants";

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

  console.log("rendering");

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

  const requestStreamList = (webSocketConn, sessId, handleId) => {
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
        transaction: "sBJerthH6Vc6",
        body: {
          request: "watch",
          id: parseInt(streamIndex),
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

    console.log(janusData);

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
            requestStreamList(websocket, sessionId, pluginId);
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
            console.log(janusData);
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
              console.log(event.streams);

              const remoteVidElem = document.getElementById("remotevideo");
              remoteVidElem.srcObject = event.streams[0];
            };

            rtcPeerConnection.setRemoteDescription(janusData.jsep).then(() => {
              console.log("Remote Session Description Accepted");

              rtcPeerConnection.createAnswer({}).then((answer) => {
                rtcPeerConnection
                  .setLocalDescription(answer)
                  .catch((err) => console.log(err));

                websocket.send(
                  JSON.stringify({
                    janus: "message",
                    session_id: sessionId,
                    handle_id: pluginId,
                    transaction: "sBJerthH6Vc6",
                    body: {
                      request: "start",
                    },
                    jsep: {
                      type: answer.type,
                      sdp: answer.sdp,
                    },
                  })
                );
              });
            });
            break;

          case "starting":
            console.log(janusData);
            break;

          default:
            break;
        }
        break;

      case "timeout":
        break;

      default:
        console.log("unknown error");
    }
  };

  const handlePlay = () => {
    requestWatch(websocket, sessionId, pluginId, selectedStream);
  };

  const handleStop = () => {};

  const onConnect = () => {
    if (connected) {
      if (!sessionId) {
        createSession(websocket);
        requestType = RequestType.CREATE;
      }

      return (
        <>
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
          <video id="remotevideo" playsInline />
          <button onClick={handlePlay}>Play</button>
          <button onClick={handleStop}>Stop</button>
        </>
      );
    } else {
      return <>Not connected</>;
    }
  };

  return <div className="stream-content">{onConnect()}</div>;
};

export default JanusVideo;
