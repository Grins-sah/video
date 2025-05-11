"use client";

import { ReactElement, useEffect, useRef } from "react";

export default function Sender():ReactElement {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    async function startStreaming() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoElement = document.querySelector("video");
      if (videoElement) {
        videoElement.srcObject = stream;
      }

      const ws = new WebSocket("ws://video.grinssah.me:8080");
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm; codecs=vp8,opus'
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            e.data.arrayBuffer().then(buffer => ws.send(buffer));
          }
        };

        mediaRecorder.start(500); // send chunks every 500ms
      };
    }

    startStreaming();

    return () => {
      mediaRecorderRef.current?.stop();
      wsRef.current?.close();
    };
  }, []);

  return (
    <div>
      <h2>Live CCTV Sender</h2>
      <video autoPlay muted playsInline style={{ width: 640, height: 480 }} />
    </div>
  );
}
