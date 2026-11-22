import { AdminHead, Empty, Panel, Panels } from "@/components/admin/parts";
import { ActionButton } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { removeAdmin, revokeInvite } from "../actions";
import { InviteForm } from "./InviteForm";

export const metadata = { title: "Users & Sub-Admins" };

export default async function UsersPage() {
  const { sb, user } = await requireAdmin();
  const [{ data: admins }, { data: invites }] = await Promise.all([
    sb.rpc("admin_list_admins"),
    sb.from("admin_invites").select("*").order("created_at", { ascending: false }).limit(50),
  ]);
  const now = Date.now();
  return (
    <>
      <AdminHead
        cap="User management & sub-admin delegation"
        title="Users & Sub-Admins"
        lede="Every admin has full rights. Invites are single-use codes stored only as a hash, and they expire. The last admin can't be removed."
      />
      <Panels>
        <Panel cap="Sub-admin invitation links" note="A single-use link that expires.">
          <InviteForm />
        </Panel>
        <Panel cap="User directory & delegation" note="Everyone with admin rights.">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Since</th>
                  <th>Note</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(
                  (admins ?? []) as {
                    user_id: string;
                    email: string;
                    added_at: string;
                    note: string | null;
                  }[]
                ).map((a) => (
                  <tr key={a.user_id}>
                    <td>
                      {a.email}
                      {a.user_id === user.id ? " (you)" : ""}
                    </td>
                    <td>{formatDate(a.added_at)}</td>
                    <td>{a.note}</td>
                    <td>
                      <ActionButton
                        className="btn btn-quiet"
                        confirm={`Remove ${a.email} as an admin?`}
                        action={removeAdmin.bind(null, a.user_id)}
                        success="Removed."
                      >
                        Remove
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Panels>
      <Panel cap="Invites">
        {invites?.length ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Note</th>
                  <th>State</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => {
                  const state = i.revoked_at
                    ? "Revoked"
                    : i.redeemed_at
                      ? `Used ${formatDate(i.redeemed_at)}`
                      : Date.parse(i.expires_at) < now
                        ? "Expired"
                        : `Open until ${formatDate(i.expires_at)}`;
                  return (
                    <tr key={i.id}>
                      <td>{formatDate(i.created_at)}</td>
                      <td>{i.note}</td>
                      <td>{state}</td>
                      <td>
                        {state.startsWith("Open") && (
                          <ActionButton
                            className="btn btn-quiet"
                            action={revokeInvite.bind(null, i.id)}
                            success="Revoked."
                          >
                            Revoke
                          </ActionButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No invites yet.</Empty>
        )}
      </Panel>
    </>
  );
}
