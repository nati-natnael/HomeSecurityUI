import React from "react";
import videojs from "video.js";

const play = (url) => {
  const player = videojs("example-video");
  player.src({
    src: url,
    type: "application/dash+xml",
  });
  player.play();
};

const Video = ({ url }) => {
  return (
    <div className="stream-content">
      <video
        id="example-video"
        width={600}
        height={300}
        class="video-js vjs-default-skin"
        controls
      ></video>
      <button onClick={() => play(url)}>Play</button>
      {/* <video
        width={620}
        height={400}
        data-dashjs-player
        // autoPlay
        src={url}
        controls
      ></video> */}
    </div>
  );
};

export default Video;
