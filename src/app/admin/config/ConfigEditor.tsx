"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveConfig } from "../actions";

/** JSON editor for one platform_config key with a diff preview; the server validates with Zod. */
export function ConfigEditor({ k, initial }: { k: string; initial: unknown }) {
  const original = JSON.stringify(initial, null, 2);
  const [text, setText] = useState(original);
  const [pending, start] = useTransition();
  const router = useRouter();
  const diff = useMemo(() => {
    const a = original.split("\n");
    const b = text.split("\n");
    const out: { t: "-" | "+"; l: string }[] = [];
    a.forEach((l) => !b.includes(l) && out.push({ t: "-", l }));
    b.forEach((l) => !a.includes(l) && out.push({ t: "+", l }));
    return out;
  }, [original, text]);
  return (
    <div className="stack">
      <label className="field">
        <span className="t-num">{k}</span>
        <textarea className="input json" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} rows={Math.min(14, text.split("\n").length + 1)} />
      </label>
      {diff.length > 0 && (
        <pre className="json card pad" aria-label="Changes" style={{ margin: 0, overflow: "auto" }}>
          {diff.map((d, i) => (
            <div key={i} style={{ color: d.t === "+" ? "var(--c-accent)" : "var(--c-text-soft)" }}>
              {d.t} {d.l}
            </div>
          ))}
        </pre>
      )}
      <div className="row">
        <button
          className="btn"
          disabled={pending || diff.length === 0}
          onClick={() =>
            start(async () => {
              const r = await saveConfig(k, text);
              if (r.ok) toast.success(`${k} saved. Both clients pick it up live.`);
              else toast.error(r.message ?? "Failed.");
              router.refresh();
            })
          }
        >
          Save {k}
        </button>
        <button className="btn btn-quiet" type="button" onClick={() => setText(original)} disabled={diff.length === 0}>
          Reset
        </button>
      </div>
    </div>
  );
}
