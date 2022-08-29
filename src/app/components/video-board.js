import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import SimpleVideo from "./video/simple-video/simple-video";

const VideoBoard = () => {
  const [streams, setStreams] = useState([]);

  const fetchStreamIds = async () => {
    try {
      const resp = await fetch("http://localhost:8080/streams");
      const data = await resp.json();
      setStreams(data.streams);
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  useEffect(() => {
    fetchStreamIds();
  }, []);

  return (
    <Container fluid="xl">
      <Row>
        {streams.map((s) => (
          <Col lg={6} md={6} sm={12} xs={12}>
            <SimpleVideo
              key={s.id}
              id={s.id}
              path={`http://localhost:8080/streams/${s.id}`}
            />
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default VideoBoard;
