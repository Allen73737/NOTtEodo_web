"use client";

import { ActionButton } from "@/components/admin/ui";
import { saveConfig } from "../actions";

/** The two switches admins reach for most: Play launch and maintenance. */
export function QuickSwitches({ playLive, maintenance }: { playLive: boolean; maintenance: { on: boolean; message: string } }) {
  return (
    <div className="card pad row" style={{ justifyContent: "space-between" }}>
      <div className="row">
        <span className="mono-cap">Google Play</span>
        <span className="pill-state" data-on={playLive}>{playLive ? "Live" : "Coming soon"}</span>
        <ActionButton
          action={() => saveConfig("play_live", JSON.stringify(!playLive))}
          confirm={playLive ? "Switch Play buttons back to Coming soon?" : "Mark NOTtEodo as live on Google Play? Every Play button becomes a link."}
        >
          {playLive ? "Mark not live" : "Mark live on Play"}
        </ActionButton>
      </div>
      <div className="row">
        <span className="mono-cap">Maintenance</span>
        <span className="pill-state" data-on={maintenance.on}>{maintenance.on ? "On" : "Off"}</span>
        <ActionButton
          action={() =>
            saveConfig(
              "maintenance",
              JSON.stringify({ on: !maintenance.on, message: maintenance.message || "Cloud sync is briefly paused for maintenance. Everything on your phone keeps working." }),
            )
          }
          confirm={maintenance.on ? "End maintenance?" : "Start maintenance? A banner shows on the site and in the app."}
        >
          {maintenance.on ? "End maintenance" : "Start maintenance"}
        </ActionButton>
      </div>
    </div>
  );
}
