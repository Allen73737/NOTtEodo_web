"use client";

import { View } from "@react-three/drei";
import { MovementScene, PhoneScene, SealScene, VaultScene } from "./scenes";

export type SceneKind = "phone" | "phone-finale" | "phone-aa" | "movement" | "seal" | "vault";

/** Renders one chapter's scene into the persistent canvas, tracking this element's box. */
export default function SceneView({ kind, chapter, screen, className }: { kind: SceneKind; chapter: string; screen?: string; className?: string }) {
  return (
    <View className={className}>
      {kind === "phone" && <PhoneScene chapter={chapter} screen={screen} mode="hero" />}
      {kind === "phone-finale" && <PhoneScene chapter={chapter} screen={screen} mode="finale" />}
      {kind === "phone-aa" && <PhoneScene chapter={chapter} screen={screen} mode="aa" />}
      {kind === "movement" && <MovementScene chapter={chapter} />}
      {kind === "seal" && <SealScene chapter={chapter} />}
      {kind === "vault" && <VaultScene chapter={chapter} />}
    </View>
  );
}
