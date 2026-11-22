"use client";

import { Line, Panel } from "@/components/admin/parts";
import { ActionButton } from "@/components/admin/ui";
import { saveConfig } from "../actions";

/** The two switches admins reach for most: Play launch and maintenance. */
export function QuickSwitches({
  playLive,
  maintenance,
}: {
  playLive: boolean;
  maintenance: { on: boolean; message: string };
}) {
  return (
    <Panel
      cap="Quick switches"
      note="The two switches reached for most. Each asks before it changes anything."
    >
      <Line
        end={
          <ActionButton
            action={() => saveConfig("play_live", JSON.stringify(!playLive))}
            confirm={
              playLive
                ? "Switch Play buttons back to Coming soon?"
                : "Mark NOTtEodo as live on Google Play? Every Play button becomes a link."
            }
          >
            {playLive ? "Mark not live" : "Mark live on Play"}
          </ActionButton>
        }
      >
        <span className="row">
          Google Play{" "}
          <span className="pill-state" data-on={playLive}>
            {playLive ? "Live" : "Coming soon"}
          </span>
        </span>
      </Line>
      <Line
        end={
          <ActionButton
            action={() =>
              saveConfig(
                "maintenance",
                JSON.stringify({
                  on: !maintenance.on,
                  message:
                    maintenance.message ||
                    "Cloud sync is briefly paused for maintenance. Everything on your phone keeps working.",
                }),
              )
            }
            confirm={
              maintenance.on
                ? "End maintenance?"
                : "Start maintenance? A banner shows on the site and in the app."
            }
          >
            {maintenance.on ? "End maintenance" : "Start maintenance"}
          </ActionButton>
        }
      >
        <span className="row">
          Maintenance{" "}
          <span className="pill-state" data-on={maintenance.on}>
            {maintenance.on ? "On" : "Off"}
          </span>
        </span>
      </Line>
    </Panel>
  );
}
