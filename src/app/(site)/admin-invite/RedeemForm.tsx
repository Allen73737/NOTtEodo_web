"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { redeemInvite } from "@/app/admin/actions";

export function RedeemForm({ code }: { code: string }) {
  const [value, setValue] = useState(code);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="stack"
      style={{ minWidth: "min(420px, 90vw)" }}
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await redeemInvite(value);
          if (r.ok) router.replace("/admin");
          else setMsg(r.message ?? "That code did not work.");
        });
      }}
    >
      <input className="input t-num" value={value} onChange={(e) => setValue(e.target.value)} placeholder="NT-XXXX-XXXX-…" required />
      {msg && <p role="alert" style={{ color: "var(--c-error)", margin: 0 }}>{msg}</p>}
      <button className="btn" disabled={pending}>
        Redeem
      </button>
    </form>
  );
}
