"use client";

import { CommunitySettings } from "@/lib/uploadTypes";
import { StepHeader, ToggleRow } from "../ui";

export function CommunityStep({ community, update }: { community: CommunitySettings; update: (patch: Partial<CommunitySettings>) => void }) {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "56px 32px 64px" }}>
      <StepHeader eyebrow="Step 6 of 9" title="Turn on the conversation" sub="DORIS is built around watching together — these are on by default, and you can moderate anytime from your dashboard." />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <ToggleRow
          icon={<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>}
          title="Timestamped discussions"
          desc="Viewers can comment on the exact moment in your film — a living conversation tied to the timeline."
          on={community.timestamped}
          onChange={(v) => update({ timestamped: v })}
        />
        <ToggleRow
          icon={<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>}
          title="Creator notes"
          desc="Pin your own commentary to specific scenes — behind-the-scenes context only you can give."
          on={community.creatorNotes}
          onChange={(v) => update({ creatorNotes: v })}
        />
        <ToggleRow
          icon={<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" /></svg>}
          title="Featured moments"
          desc="DORIS surfaces the most-discussed scenes on your title page and in the player timeline."
          on={community.featuredMoments}
          onChange={(v) => update({ featuredMoments: v })}
        />
      </div>
    </div>
  );
}
