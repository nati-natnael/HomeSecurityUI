import React from "react";
import { Nav, Card } from "react-bootstrap";
import "./App.css";
import JanusVideo from "./Video/JanusVideo/JanusVideo";

function App() {
  return (
    <>
      <div className="wrapper">
        <div className="main-content">
          <Card>
            <Card.Body>
              <JanusVideo />
            </Card.Body>
          </Card>
        </div>
        <div className="side-content">
          <Nav defaultActiveKey="/home" as="div">
            <Nav.Item as="div">Home safE</Nav.Item>
            <Nav.Item as="div">Security</Nav.Item>
            <Nav.Item as="div">Control</Nav.Item>
          </Nav>
        </div>
      </div>
    </>
  );
}

export default App;
