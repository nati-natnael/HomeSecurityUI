import React from "react";
import { Card } from "react-bootstrap";

import "./simple-video.css";

const SimpleVideo = ({ id, name, path }) => {
  return (
    <Card>
      <Card.Title>{name}</Card.Title>
      <Card.Img variant="top" src={path} alt={`video stream ${id}`} />
    </Card>
  );
};

export default SimpleVideo;
