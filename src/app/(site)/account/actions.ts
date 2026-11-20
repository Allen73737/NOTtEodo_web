"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/supabase/server";

/** Deletes one Nodo memory. RLS lets a user delete only their own rows. */
export async function forgetMemory(fd: FormData) {
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return;
  const { sb, user } = await getViewer();
  if (!sb || !user) return;
  await sb.from("nodo_memories").delete().eq("id", id.data).eq("user_id", user.id);
  revalidatePath("/account");
}

/** "Forget everything": memories and the running conversation summary. */
export async function forgetAllMemories() {
  const { sb, user } = await getViewer();
  if (!sb || !user) return;
  await Promise.all([
    sb.from("nodo_memories").delete().eq("user_id", user.id),
    sb.from("nodo_threads").delete().eq("user_id", user.id),
  ]);
  revalidatePath("/account");
}
