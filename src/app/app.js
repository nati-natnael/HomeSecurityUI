import React, { useState, useEffect } from "react";
import { Navbar } from "react-bootstrap";
import JMuxer from "jmuxer";
import "./app.css";
import JanusVideo from "./video/janus-video/janus-video";

function App() {
  const [image, setImage] = useState();

  useEffect(() => {
    const video = document.getElementById("player");

    const muxer = new JMuxer({
      node: "player",
      mode: "video",
      flushingTime: 500,
      fps: 30,
      debug: true,
      onReady: () => {
        console.log("jmuxer is ready");
      },
      onError: (err) => {
        console.log("jmuxer error", err);
      },
    });

    const ws = new WebSocket("ws://192.168.0.19:9000");
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      console.log("connection open");
    };

    ws.onclose = () => {
      console.log("connection closed");
    };

    ws.onerror = (err) => {
      console.log(err);
    };

    ws.onmessage = async (message) => {
      muxer.feed({
        video: new Uint8Array(message.data),
      });
    };
  }, []);

  return (
    <>
      <div className="wrapper">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Navbar.Brand href="">Home-Security</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          {/* <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link href="#home">Home</Nav.Link>
              <Nav.Link href="#link">Link</Nav.Link>
            </Nav>
          </Navbar.Collapse> */}
        </Navbar>
        <div className="main-content">
          <video id="player" autoPlay muted controls></video>
          {/* <img src="http://localhost:8080/streams/stream/1" /> */}
        </div>
      </div>
    </>
  );
}

export default App;
