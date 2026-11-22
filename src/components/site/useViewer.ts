"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Viewer = { signedIn: boolean; admin: boolean };
const NOBODY: Viewer = { signedIn: false, admin: false };
const KEY = "nt-viewer";

/**
 * Who is browsing, for the nav: signed in, and an admin (public.is_app_admin(), the same check the
 * admin layout makes on every request, so this only decides whether to show the way in). The last
 * answer is kept for the tab, so the Admin link is there at once on the next page, then re-checked;
 * signing in or out updates it straight away. Pages stay static: nothing here touches the server render.
 */
export function useViewer(): Viewer {
  const [viewer, setViewer] = useState<Viewer>(NOBODY);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let live = true;
    const save = (v: Viewer) => {
      if (!live) return;
      setViewer(v);
      try {
        sessionStorage.setItem(KEY, JSON.stringify(v));
      } catch {
        /* storage blocked: it is re-checked on each page anyway */
      }
    };
    try {
      const cached = sessionStorage.getItem(KEY);
      if (cached) setViewer(JSON.parse(cached) as Viewer);
    } catch {
      /* fine */
    }
    const check = async (signedIn: boolean) => {
      if (!signedIn) return save(NOBODY);
      const { data } = await sb.rpc("is_app_admin");
      save({ signedIn: true, admin: data === true });
    };
    void sb.auth.getSession().then(({ data }: { data: { session: Session | null } }) => check(Boolean(data.session)));
    const { data: sub } = sb.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void check(Boolean(session));
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return viewer;
}
