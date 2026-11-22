/**
 * Row-level security and RPC tests for the website platform migration, run against the
 * app's real migration chain in an in-process Postgres (PGlite). Each case runs as anon,
 * a signed-in user or an admin inside a rolled-back transaction.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { as, freshDb, type Db } from "./harness";

const ADMIN = "00000000-0000-4000-8000-00000000000a";
const USER = "00000000-0000-4000-8000-00000000000b";
const OTHER = "00000000-0000-4000-8000-00000000000c";
const H = (c: string) => c.repeat(64);

let db: Db;
const anon = <T>(fn: (q: Db) => Promise<T>) => as(db, { role: "anon" }, fn);
const user = <T>(fn: (q: Db) => Promise<T>, sub = USER) => as(db, { role: "authenticated", sub }, fn);
const admin = <T>(fn: (q: Db) => Promise<T>) => as(db, { role: "authenticated", sub: ADMIN }, fn);

async function fails(p: Promise<unknown>, pattern?: RegExp) {
  let err: unknown = null;
  try {
    await p;
  } catch (e) {
    err = e;
  }
  expect(err, "expected the statement to be rejected").not.toBeNull();
  if (pattern) expect(String((err as Error).message)).toMatch(pattern);
}

const release = (code: number, extra = "") =>
  `INSERT INTO app_releases (version_name, version_code, file_path, file_size_bytes, sha256, is_published, is_latest${extra ? ", " + extra.split("=")[0] : ""})
   VALUES ('1.0.${code}', ${code}, 'NOTtEodo-1.0.${code}.apk', 1000, '${H("a")}', true, true${extra ? ", " + extra.split("=")[1] : ""}) RETURNING id`;

beforeAll(async () => {
  db = await freshDb();
  await db.exec(`INSERT INTO auth.users (id, email) VALUES
    ('${ADMIN}', 'owner@example.invalid'), ('${USER}', 'user@example.invalid'), ('${OTHER}', 'other@example.invalid');
    INSERT INTO app_admins (user_id, note) VALUES ('${ADMIN}', 'owner');`);
}, 120_000);

describe("platform_config", () => {
  it("is readable by anyone", async () => {
    const r = await anon((q) => q.query("SELECT key FROM platform_config"));
    expect(r.rows.length).toBeGreaterThan(5);
  });
  it("cannot be written by anon or ordinary users", async () => {
    await fails(anon((q) => q.query("UPDATE platform_config SET value = 'true' WHERE key = 'play_live'")), /permission denied/);
    const n = await user(async (q) => {
      const r = await q.query("UPDATE platform_config SET value = 'true' WHERE key = 'play_live'");
      return r.affectedRows;
    });
    expect(n).toBe(0);
  });
  it("is writable by an admin and the write is audited", async () => {
    const audited = await admin(async (q) => {
      await q.query("UPDATE platform_config SET value = 'true' WHERE key = 'play_live'");
      const r = await q.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM admin_audit_log WHERE table_name = 'platform_config' AND actor = '${ADMIN}'`,
      );
      return r.rows[0]!.n;
    });
    expect(audited).toBe(1);
  });
});

describe("app_releases", () => {
  it("anon sees only published releases and cannot insert", async () => {
    await admin(async (q) => {
      await q.query(release(10));
      await q.query(`INSERT INTO app_releases (version_name, version_code, file_path, file_size_bytes, sha256)
                     VALUES ('1.0.11', 11, 'NOTtEodo-1.0.11.apk', 1000, '${H("b")}')`);
      await q.exec("RESET ROLE; SET LOCAL ROLE anon; SELECT set_config('request.jwt.claim.sub', '', true);");
      const r = await q.query<{ version_code: number }>("SELECT version_code FROM app_releases");
      expect(r.rows.map((x) => x.version_code)).toEqual([10]);
      await q.exec("SAVEPOINT s");
      await fails(q.query(release(12)), /permission denied|row-level security/);
      await q.exec("ROLLBACK TO SAVEPOINT s");
    });
  });
  it("rejects a lower versionCode and keeps one latest per channel", async () => {
    await admin(async (q) => {
      await q.query(release(20));
      await q.exec("SAVEPOINT s");
      await fails(q.query(release(19)), /must be higher/);
      await q.exec("ROLLBACK TO SAVEPOINT s");
      await q.query(release(21));
      const latest = await q.query<{ version_code: number }>("SELECT version_code FROM app_releases WHERE is_latest");
      expect(latest.rows.map((r) => r.version_code)).toEqual([21]);
      const cfg = await q.query<{ value: number }>("SELECT value FROM platform_config WHERE key = 'latest_version_code'");
      expect(cfg.rows[0]!.value).toBe(21);
    });
  });
  it("ordinary users cannot insert releases", async () => {
    await fails(user((q) => q.query(release(30))), /row-level security/);
  });
  it("counts a download once per hashed client per day without auditing it", async () => {
    await admin(async (q) => {
      const r = await q.query<{ id: string }>(release(40));
      const id = r.rows[0]!.id;
      await q.exec("SET LOCAL ROLE anon");
      const first = await q.query<{ ok: boolean }>("SELECT increment_download($1, $2) AS ok", [id, H("c")]);
      const again = await q.query<{ ok: boolean }>("SELECT increment_download($1, $2) AS ok", [id, H("c")]);
      expect(first.rows[0]!.ok).toBe(true);
      expect(again.rows[0]!.ok).toBe(false);
      await q.exec("RESET ROLE");
      const c = await q.query<{ download_count: number }>("SELECT download_count FROM app_releases WHERE id = $1", [id]);
      expect(Number(c.rows[0]!.download_count)).toBe(1);
      const audits = await q.query<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM admin_audit_log WHERE table_name = 'app_releases' AND op = 'UPDATE'",
      );
      expect(audits.rows[0]!.n).toBe(0);
    });
  });
  it("rejects a malformed client hash", async () => {
    await fails(anon((q) => q.query("SELECT increment_download(gen_random_uuid(), 'not-a-hash')")), /invalid client hash/);
  });
});

describe("announcements", () => {
  it("rejects javascript: and protocol-relative CTA links", async () => {
    await fails(admin((q) => q.query("INSERT INTO announcements (title, cta_url) VALUES ('x', 'javascript:alert(1)')")));
    await fails(admin((q) => q.query("INSERT INTO announcements (title, cta_url) VALUES ('x', '//evil.example')")));
  });
  it("anon sees active ones only", async () => {
    await admin(async (q) => {
      await q.query("INSERT INTO announcements (title, is_active) VALUES ('live', true), ('off', false)");
      await q.query("INSERT INTO announcements (title, ends_at, starts_at) VALUES ('past', NOW() - interval '1 day', NOW() - interval '2 day')");
      await q.exec("SET LOCAL ROLE anon; SELECT set_config('request.jwt.claim.sub', '', true);");
      const r = await q.query<{ title: string }>("SELECT title FROM announcements");
      expect(r.rows.map((x) => x.title)).toEqual(["live"]);
    });
  });
});

describe("private tables", () => {
  it("anon and users cannot read subscribers, invites or the audit log", async () => {
    for (const t of ["release_subscribers", "admin_invites", "admin_audit_log", "page_feedback"]) {
      await fails(anon((q) => q.query(`SELECT * FROM ${t}`)), /permission denied/);
      const r = await user((q) => q.query(`SELECT * FROM ${t}`));
      expect(r.rows.length).toBe(0);
    }
  });
  it("testimonials cannot be published without consent", async () => {
    await fails(
      admin((q) => q.query("INSERT INTO testimonials (quote, name, source, is_published) VALUES ('A lovely app to use', 'A', 'email', true)")),
      /check constraint/,
    );
  });
});

describe("admin invites", () => {
  it("a code makes a user an admin once, and only once", async () => {
    await admin(async (q) => {
      const r = await q.query<{ code: string }>("SELECT create_admin_invite('test') AS code");
      const code = r.rows[0]!.code;
      expect(code).toMatch(/^NT-[0-9A-F]{4}(-[0-9A-F]{4}){5}$/);
      const stored = await q.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM admin_invites WHERE code_hash = encode(digest($1, 'sha256'), 'hex')", [code]);
      expect(stored.rows[0]!.n).toBe(1);
      await q.query(`SELECT set_config('request.jwt.claim.sub', '${USER}', true)`);
      const ok = await q.query<{ ok: boolean }>("SELECT redeem_admin_invite($1) AS ok", [code]);
      expect(ok.rows[0]!.ok).toBe(true);
      const isAdmin = await q.query<{ a: boolean }>("SELECT is_app_admin() AS a");
      expect(isAdmin.rows[0]!.a).toBe(true);
      await q.query(`SELECT set_config('request.jwt.claim.sub', '${OTHER}', true)`);
      const reuse = await q.query<{ ok: boolean }>("SELECT redeem_admin_invite($1) AS ok", [code]);
      expect(reuse.rows[0]!.ok).toBe(false);
    });
  });
  it("non-admins cannot create invites or read counts", async () => {
    await fails(user((q) => q.query("SELECT create_admin_invite()")), /Only admins/);
    await fails(user((q) => q.query("SELECT admin_table_counts()")), /Admins only/);
  });
  it("the last admin cannot be removed", async () => {
    await fails(admin((q) => q.query(`SELECT admin_revoke_admin('${ADMIN}')`)), /last admin/);
  });
  it("admins see real table counts", async () => {
    const r = await admin((q) => q.query<{ c: Record<string, number> }>("SELECT admin_table_counts() AS c"));
    expect(r.rows[0]!.c.app_admins).toBe(1);
    expect(r.rows[0]!.c).toHaveProperty("accounts");
  });
});

describe("feedback replies", () => {
  it("authors cannot write a reply into their own feedback", async () => {
    await fails(
      user((q) =>
        q.query(`INSERT INTO user_feedback (user_id, title, description, admin_reply) VALUES ('${USER}', 't', 'd', 'fake reply')`),
      ),
      /row-level security/,
    );
  });
  it("an admin reply is visible to its author and not to others", async () => {
    await db.exec("BEGIN");
    try {
      const r = await db.query<{ id: string }>(
        `INSERT INTO user_feedback (user_id, title, description, source) VALUES ('${USER}', 'Idea', 'More widgets', 'web') RETURNING id`,
      );
      const id = r.rows[0]!.id;
      await db.exec(`SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${ADMIN}', true);`);
      await db.query("UPDATE user_feedback SET admin_reply = 'Planned for the next release', status = 'planned' WHERE id = $1", [id]);
      await db.query(`SELECT set_config('request.jwt.claim.sub', '${USER}', true)`);
      const mine = await db.query<{ admin_reply: string }>("SELECT admin_reply FROM user_feedback WHERE id = $1", [id]);
      expect(mine.rows[0]?.admin_reply).toBe("Planned for the next release");
      await db.query(`SELECT set_config('request.jwt.claim.sub', '${OTHER}', true)`);
      const theirs = await db.query("SELECT * FROM user_feedback WHERE id = $1", [id]);
      expect(theirs.rows.length).toBe(0);
    } finally {
      await db.exec("ROLLBACK");
    }
  });
});

describe("public RPCs", () => {
  it("public_status and public_nodo_insights work for anon", async () => {
    const s = await anon((q) => q.query<{ s: { db: string } }>("SELECT public_status() AS s"));
    expect(s.rows[0]!.s.db).toBe("ok");
    const i = await anon((q) => q.query("SELECT * FROM public_nodo_insights()"));
    expect(Array.isArray(i.rows)).toBe(true);
  });
});
