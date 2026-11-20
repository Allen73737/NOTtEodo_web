"use client";

import { View } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";

/**
 * The single persistent canvas behind the page. Each chapter renders its scene into a
 * drei <View> that tracks a DOM element, so one WebGL context serves the whole film,
 * survives scrolling, and is disposed when the visitor leaves the homepage.
 */
export function World() {
  const [source, setSource] = useState<HTMLElement | null>(null);
  useEffect(() => setSource(document.body), []);
  if (!source) return null;
  return (
    <Canvas
      className="world"
      eventSource={source}
      eventPrefix="client"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          document.documentElement.dataset.film = "lite";
        });
      }}
      aria-hidden="true"
    >
      <View.Port />
    </Canvas>
  );
}
