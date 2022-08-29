import React from "react";
import { Card } from "react-bootstrap";

import "./simple-video.css";

const SimpleVideo = ({ id, path }) => {
  return (
    <Card>
      <Card.Img variant="top" src={path} alt={`video stream ${id}`} />
    </Card>
  );
};

export default SimpleVideo;
