import { AdminHead, Metric, Metrics, Panel } from "@/components/admin/parts";
import { requireAdmin } from "@/lib/admin";
import { env } from "@/lib/env";

export const metadata = { title: "Cloud & Network" };

const FUNCTIONS = [
  "ai-assist",
  "scoped-ai",
  "rag-embedder",
  "cloudinary-sign",
  "delete-account",
  "vault-gatekeeper",
];

async function ping(name: string) {
  const t = Date.now();
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`, {
      method: "OPTIONS",
      headers: { Origin: "https://example.invalid", "Access-Control-Request-Method": "POST" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return { name, ok: res.status < 500, status: res.status, ms: Date.now() - t };
  } catch {
    return { name, ok: false, status: 0, ms: Date.now() - t };
  }
}

/** CLOUD & NETWORK HEALTH MONITOR: edge-function liveness (CORS preflight) and a DB round trip. */
export default async function CloudPage() {
  const { sb } = await requireAdmin();
  const t = Date.now();
  const { error } = await sb.rpc("public_status");
  const dbMs = Date.now() - t;
  const fns = await Promise.all(FUNCTIONS.map(ping));
  return (
    <>
      <AdminHead
        cap="Cloud & network health monitor"
        title="Cloud & Network"
        lede="Each edge function answers a CORS preflight without credentials, which shows it is deployed and responding. Supabase's own status page covers the platform."
      />
      <Metrics>
        <Metric label="Database" value={error ? "Down" : "Online"} sub={`round trip ${dbMs} ms`} />
        <Metric
          label="Edge functions"
          value={`${fns.filter((f) => f.ok).length}/${fns.length}`}
          sub="answering"
        />
      </Metrics>
      <Panel cap="Edge functions" note="CORS preflight, no credentials.">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Function</th>
                <th>State</th>
                <th>HTTP</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody>
              {fns.map((f) => (
                <tr key={f.name}>
                  <td className="t-num">{f.name}</td>
                  <td>
                    <span className="pill-state" data-on={f.ok}>
                      {f.ok ? "Online" : "Unreachable"}
                    </span>
                  </td>
                  <td className="t-num">{f.status || "-"}</td>
                  <td className="t-num">{f.ms} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="t-label">
          Platform status:{" "}
          <a href="https://status.supabase.com" rel="noopener">
            status.supabase.com
          </a>
        </p>
      </Panel>
    </>
  );
}
