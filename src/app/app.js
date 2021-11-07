import React from "react";
import { Navbar } from "react-bootstrap";
import "./app.css";
import SimpleVideo from "./video/simple-video/simple-video";

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
          <SimpleVideo streamPath="http://localhost:8080/streams/0" />
          <SimpleVideo streamPath="http://localhost:8080/streams/1" />
        </div>
      </div>
    </>
  );
}

export default App;
