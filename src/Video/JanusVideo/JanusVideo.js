import React, { useState } from "react";

const server = "ws://192.168.0.8:8188";
const protocol = "janus-protocol";
const websocket = new WebSocket(server, protocol);

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

const JanusVideo = () => {
  const [connected, setConnected] = useState(false);
  const [streamList, setStreamList] = useState([]);
  const [selectedStream, setSelectedStream] = useState(1);

  console.log("Loading ..., Connected: ", connected);

  let requestType = "create";
  let sessionId = null;
  let pluginId = null;

  rtcPeerConnection.ontrack = (event) => {
    console.log(event.streams);

    const remoteVidElem = document.getElementById("remotevideo");
    remoteVidElem.srcObject = event.streams[0];
  };

  rtcPeerConnection.onicecandidate = (event) => {};

  websocket.onopen = (event) => {
    setConnected(true);
    console.log("inside on open");
  };

  websocket.onclose = (event) => {
    setConnected(false);
  };

  websocket.onerror = (event) => {
    console.log("connection error");
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
          case "create":
            sessionId = janusData.data.id;

            requestType = "attach";
            websocket.send(
              JSON.stringify({
                janus: "attach",
                session_id: sessionId,
                plugin: "janus.plugin.streaming",
                transaction: "nati",
              })
            );
            break;

          case "attach":
            pluginId = janusData.data.id;

            requestType = "list";
            websocket.send(
              JSON.stringify({
                janus: "message",
                session_id: sessionId,
                handle_id: pluginId,
                transaction: "sBJNyUhH6Vc6",
                body: {
                  request: "list",
                },
              })
            );
            break;

          case "list":
            if (streamList.length === 0) {
              setStreamList(
                janusData.plugindata.data.list.map((data) => {
                  return { id: data.id, name: data.description };
                })
              );
            }
            console.log(janusData.plugindata.data.list);

            requestType = "none";

            // websocket.send(
            //   JSON.stringify({
            //     janus: "message",
            //     session_id: sessionId,
            //     handle_id: pluginId,
            //     transaction: "sBJerthH6Vc6",
            //     body: {
            //       request: "watch",
            //       id: selectedStream,
            //     },
            //   })
            // );

            break;

          case "watch":
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

  const onConnect = () => {
    // debugger;
    if (connected) {
      if (requestType === "create") {
        websocket.send(
          JSON.stringify({ janus: "create", transaction: "nati" })
        );
      }

      return (
        <>
          <select
            onChange={(event) => {
              setSelectedStream(event.target.value);
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
        </>
      );
    } else {
      return <></>;
    }
  };

  return (
    <div className="stream-content">
      {/* <button
        id="start"
        onClick={() =>
          websocket.send(
            JSON.stringify({ janus: "create", transaction: "nati" })
          )
        }
        disabled={!connected}
      >
        Get Session
      </button> */}
      {onConnect()}
    </div>
  );
};

export default JanusVideo;
