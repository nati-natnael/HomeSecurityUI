import React from "react";

const SimpleVideo = (props) => {
  const { streamPath } = props;

  return (
    <div className="simple-video">
      <img src={streamPath} alt="video stream" />
    </div>
  );
};

export default SimpleVideo;
