import React from "react";
import { Nav, Navbar } from "react-bootstrap";
import "./App.css";
import JanusVideo from "./Video/JanusVideo/JanusVideo";

function App() {
  return (
    <>
      <div className="wrapper">
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="#home">Home-Security</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link href="#home">Home</Nav.Link>
              <Nav.Link href="#link">Link</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div className="main-content">
          <JanusVideo ip="192.168.0.8" port="8188" protocol="janus-protocol" />
        </div>
      </div>
    </>
  );
}

export default App;
