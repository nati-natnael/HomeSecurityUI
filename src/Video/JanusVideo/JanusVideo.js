import React from 'react';

const JanusVideo = ({ url }) => {
    const server = 'ws://192.168.0.8:8188';
    const protocol = 'janus-protocol';
    let connected = false;
    let sessionId = null;
    let pluginId = null;
    let requestType = 'create';

    const websocket = new WebSocket(server, protocol);

    websocket.onopen = (event) => {
        connected = true;
    };

    websocket.onerror = (event) => {
        console.log('connection error');
    };

    websocket.onmessage = (event) => {
        const janusData = JSON.parse(event.data);

        switch (janusData['janus']) {
            case 'keepalive':
                break;

            case 'ack':
                break;

            case 'success':
                switch (requestType) {
                    case 'create':
                        sessionId = janusData.data.id;

                        requestType = 'attach';
                        websocket.send(
                            JSON.stringify({
                                janus: 'attach',
                                session_id: sessionId,
                                plugin: 'janus.plugin.streaming',
                                transaction: 'nati',
                            })
                        );
                        break;

                    case 'attach':
                        pluginId = janusData.data.id;
                        break;
                }
                break;

            case 'trickle':
                break;

            case 'webrtcup':
                break;

            case 'hangup':
                break;

            case 'detached':
                break;

            case 'media':
                break;

            case 'error':
                break;

            case 'event':
                break;

            case 'timeout':
                break;

            default:
                console.log('unknown error');
        }
    };

    return (
        <div className="stream-content">
            <button
                id="start"
                onClick={() =>
                    websocket.send(
                        JSON.stringify({ janus: 'create', transaction: 'nati' })
                    )
                }
                disabled={connected}
            >
                Get Session
            </button>
        </div>
    );
};

export default Video;
