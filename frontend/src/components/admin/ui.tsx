"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import type { Result } from "@/app/admin/actions";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Runs a server action from a button, with an optional confirm step and a toast for the result. */
export function ActionButton({
  action,
  children,
  confirm,
  className = "btn btn-ghost",
  success = "Done.",
}: {
  action: () => Promise<Result>;
  children: ReactNode;
  confirm?: string;
  className?: string;
  success?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const r = await action();
          if (r.ok) toast.success(r.message ?? success);
          else toast.error(r.message ?? "Failed.");
          router.refresh();
        });
      }}
    >
      {pending ? "Working" : children}
    </button>
  );
}

/** A form whose submit calls a server action taking FormData and returning Result. */
export function ActionForm({
  action,
  children,
  className = "stack",
  resetOnSuccess = false,
  onDone,
}: {
  action: (fd: FormData) => Promise<Result>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onDone?: (r: Result) => void;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className={className}
      aria-busy={pending}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await action(fd);
          if (r.ok) {
            toast.success(r.message ?? "Saved.");
            if (resetOnSuccess) form.reset();
          } else toast.error(r.message ?? "Failed.");
          onDone?.(r);
          router.refresh();
        });
      }}
    >
      {children}
    </form>
  );
}

/** Signs an admin out after 30 minutes without input. */
export function IdleTimeout({ minutes = 30 }: { minutes?: number }) {
  useEffect(() => {
    let t = 0;
    const reset = () => {
      window.clearTimeout(t);
      t = window.setTimeout(async () => {
        await supabaseBrowser()?.auth.signOut({ scope: "local" });
        window.location.href = "/auth/sign-in?next=/admin&reason=idle";
      }, minutes * 60_000);
    };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      window.clearTimeout(t);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [minutes]);
  return null;
}

/** Shows a value once (e.g. an invite code) with a copy button. */
export function Reveal({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="card pad stack" role="status">
      <p className="t-label" style={{ margin: 0 }}>{label}. It is shown only once.</p>
      <code style={{ fontSize: "1rem", wordBreak: "break-all" }}>{value}</code>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
