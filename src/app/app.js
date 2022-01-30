import React from "react";
import { Navbar } from "react-bootstrap";
import VideoBoard from "./components/video-board";
import "./app.css";

function App() {
  return (
    <>
      <header>
        <Navbar bg="dark" variant="dark" expand="lg">
          <Navbar.Brand href="/">Home-Security</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
        </Navbar>
      </header>

      <main>
        <VideoBoard />
      </main>
    </>
  );
}

export default App;
