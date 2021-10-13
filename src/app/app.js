import React, { useState } from "react";
import { Navbar } from "react-bootstrap";
import "./app.css";
import JanusVideo from "./video/janus-video/janus-video";

function App() {
  const [image, setImage] = useState()
  const newConnection = new WebSocket("ws://localhost:8080");

  newConnection.onopen = () => {
    console.log("connection open");
  };

  newConnection.onclose = () => {
    console.log("connection closed");
  };

  newConnection.onerror = (err) => {
    console.log(err);
  };

  newConnection.onmessage = async (message) => {
    dataUri = new DataUri(message?.data)
    setImage(dataUri);
    console.log(message?.data);
  };

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
          <img xlink:href={image} />
          {/* <img src="http://localhost:8080/streams/stream/1" /> */}
        </div>
      </div>
    </>
  );
}

export default App;
