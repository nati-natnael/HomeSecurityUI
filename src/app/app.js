import React from "react";
import { Navbar } from "react-bootstrap";
import "./app.css";
import JanusVideo from "./video/janus-video/janus-video";

function App() {
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
          <img src="http://localhost:8080/streams/stream/0" />
          <img src="http://localhost:8080/streams/stream/1" />
        </div>
      </div>
    </>
  );
}

export default App;
