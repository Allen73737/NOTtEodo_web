"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { SceneKind } from "@/three/SceneView";
import { useFilmMode } from "./FilmProvider";

const SceneView = dynamic(() => import("@/three/SceneView"), { ssr: false });

/**
 * A 3D stage in the full path; otherwise its designed fallback (a real screenshot or poster).
 * The fallback is server-rendered, so the content is always there without JS or WebGL.
 */
export function Stage({ kind, chapter, screen, fallback, className }: { kind: SceneKind; chapter: string; screen?: string; fallback: ReactNode; className?: string }) {
  const mode = useFilmMode();
  return (
    <div className={`stage ${className ?? ""}`} data-stage={kind}>
      {mode === "full" ? <SceneView kind={kind} chapter={chapter} screen={screen} className="stage__view" /> : <div className="stage__fallback">{fallback}</div>}
    </div>
  );
}
