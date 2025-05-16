"use client";

import { ReactElement, useEffect, useRef } from "react";

export default function Receiver():ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const queueRef = useRef<Uint8Array[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    const videoEl = videoRef.current!;
    videoEl.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener("sourceopen", () => {
      const mime = 'video/webm; codecs="vp8,opus"';

      if (!MediaSource.isTypeSupported(mime)) {
        console.error("MIME not supported:", mime);
        return;
      }

      const sourceBuffer = mediaSource.addSourceBuffer(mime);
      sourceBuffer.mode = "segments";
      sourceBufferRef.current = sourceBuffer;

      sourceBuffer.addEventListener("updateend", appendNextChunk);

      const ws = new WebSocket("ws://localhost:8080");
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onmessage = (event) => {
        queueRef.current.push(new Uint8Array(event.data));
        if (!sourceBuffer.updating) {
          appendNextChunk();
        }
      };

      ws.onopen = () => console.log("Receiver WebSocket connected");
      ws.onerror = (err) => console.error("WebSocket error", err);
      ws.onclose = () => console.log("Receiver WebSocket closed");
    });

function appendNextChunk() {
  const sourceBuffer = sourceBufferRef.current;
  const mediaSource = mediaSourceRef.current;

  if (
    !sourceBuffer ||
    !mediaSource ||
    sourceBuffer.updating ||
    queueRef.current.length === 0 ||
    mediaSource.readyState !== "open"
  ) return;

  try {
    const chunk = queueRef.current.shift()!;
    sourceBuffer.appendBuffer(chunk);
  } catch (err) {
    console.error("Error appending buffer:", err);
  }
}


return () => {
  wsRef.current?.close();

  const videoEl = videoRef.current;
  if (videoEl?.src) {
    URL.revokeObjectURL(videoEl.src);
  }

  if (mediaSourceRef.current) {
    if (mediaSourceRef.current.readyState === "open") {
      try {
        mediaSourceRef.current.endOfStream();
      } catch {}
    }
  }

  queueRef.current = [];
  sourceBufferRef.current = null;
  mediaSourceRef.current = null;
};

  }, []);

  return (
    <div>
      <h2>Live CCTV Receiver</h2>
      <video ref={videoRef} autoPlay muted controls playsInline style={{ width: 640, height: 480 }} />
    </div>
  );
}
