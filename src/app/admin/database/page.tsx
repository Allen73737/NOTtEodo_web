import { AdminHead, Metric, Metrics, Panel } from "@/components/admin/parts";
import { requireAdmin } from "@/lib/admin";
import { formatBytes } from "@/lib/format";

export const metadata = { title: "Database & Vault" };

/** DATABASE & LOCAL VAULT: row counts per table and storage per bucket (admins only RPCs). */
export default async function DatabasePage() {
  const { sb } = await requireAdmin();
  const [{ data: counts }, { data: storage }] = await Promise.all([
    sb.rpc("admin_table_counts"),
    sb.rpc("admin_storage_usage"),
  ]);
  const rows = Object.entries((counts ?? {}) as Record<string, number>).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  return (
    <>
      <AdminHead
        cap="Database & local vault"
        title="Database & Vault"
        lede="Vault contents never reach the server: PINs and vault keys stay on each device, so only unlock events appear in the security log."
      />
      <Metrics>
        {rows.map(([k, v]) => (
          <Metric key={k} label={k.replace(/_/g, " ")} value={v} />
        ))}
      </Metrics>
      <Panel cap="Storage buckets">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Bucket</th>
                <th>Objects</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {((storage ?? []) as { bucket: string; objects: number; bytes: number }[]).map((b) => (
                <tr key={b.bucket}>
                  <td>{b.bucket}</td>
                  <td className="t-num">{b.objects}</td>
                  <td className="t-num">{formatBytes(Number(b.bytes)) || "0 KB"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="t-label">Photos and voice notes live in Cloudinary (India) and are not counted here.</p>
      </Panel>
    </>
  );
}
