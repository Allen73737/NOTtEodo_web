import { NextResponse } from "next/server";
import { getViewer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Your synced data as JSON (data portability). RLS returns only the caller's rows. */
export async function GET() {
  const { sb, user } = await getViewer();
  if (!sb || !user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const [{ data: collections }, { data: memories }, { data: feedback }] = await Promise.all([
    sb.from("user_collections").select("collection,data,updated_at"),
    sb.from("nodo_memories").select("kind,content,created_at"),
    sb.from("user_feedback").select("title,description,type,status,admin_reply,created_at"),
  ]);
  const body = {
    exported_at: new Date().toISOString(),
    account: { email: user.email, created_at: user.created_at },
    note: "Collections encrypted with your passphrase appear as {v, ct}; restore them in the app.",
    collections: collections ?? [],
    nodo_memories: memories ?? [],
    feedback: feedback ?? [],
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="notteodo-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
