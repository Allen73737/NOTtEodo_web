"use client";

import { useState } from "react";
import { ActionForm, Reveal } from "@/components/admin/ui";
import { createInvite } from "../actions";

export function InviteForm() {
  const [link, setLink] = useState<string | null>(null);
  return (
    <>
      <ActionForm
        action={createInvite}
        resetOnSuccess
        onDone={(r) => r.ok && setLink((r.data as { link: string }).link)}
      >
        <div className="form-grid">
          <label className="field">
            Note (who it is for)
            <input className="input" name="note" maxLength={200} />
          </label>
          <label className="field">
            Expires after
            <select className="input" name="hours" defaultValue="72">
              <option value="24">24 hours</option>
              <option value="72">3 days</option>
              <option value="168">7 days</option>
            </select>
          </label>
        </div>
        <button className="btn">Generate invite link</button>
      </ActionForm>
      {link && <Reveal label="Invite link" value={link} />}
    </>
  );
}
