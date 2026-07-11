"use client";

import { useApp } from "@/lib/store";
import { useFilmActions } from "@/lib/actions";
import { film, naira } from "@/lib/data";
import { chipStyle } from "@/lib/uiStyles";

export function PaymentSheet() {
  const { pay, payFilmId, payMethod, setPayMethod, closePay, confirmPay } = useApp();
  const { openPlayer } = useFilmActions();
  if (!pay || payFilmId == null) return null;
  const f = film(payFilmId);
  const price = naira(f.price || 0);
  const share = naira(Math.round((f.price || 0) * 0.7));

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) closePay(); }}
      style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}
    >
      <div style={{ width: "100%", maxWidth: 440, background: "var(--surface-3)", border: "1px solid var(--border-subtle)", borderRadius: 14, boxShadow: "0 16px 48px rgba(0,0,0,.65)", overflow: "hidden", animation: "dorisRise 250ms var(--ease-standard)" }}>
        {pay === "form" && (
          <div style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Rent {f.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 3 }}>Watch as many times as you like for 48 hours</div>
              </div>
              <button onClick={closePay} style={{ width: 30, height: 30, flex: "none", border: "none", borderRadius: 999, background: "rgba(255,255,255,.08)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 15 }}>✕</button>
            </div>
            <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 9, fontSize: 13.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary)" }}>48-hour rental</span><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{price}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary)" }}>Goes to {f.creator}</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--success)", fontWeight: 600 }}>{share} (70%)</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 9, borderTop: "1px solid var(--border-subtle)" }}><span style={{ fontWeight: 700 }}>You pay today</span><span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15 }}>{price}</span></div>
            </div>
            <div style={{ margin: "16px 0 8px", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Pay with</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPayMethod("card")} style={chipStyle(payMethod === "card")}>Card</button>
              <button onClick={() => setPayMethod("bank")} style={chipStyle(payMethod === "bank")}>Bank transfer</button>
              <button onClick={() => setPayMethod("ussd")} style={chipStyle(payMethod === "ussd")}>USSD</button>
            </div>
            <button onClick={confirmPay} style={{ width: "100%", marginTop: 18, minHeight: 50, border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Pay {price} · start 48hr window</button>
            <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "var(--text-tertiary)", textAlign: "center" }}>Your window starts when payment confirms — not before.</p>
          </div>
        )}
        {pay === "success" && (
          <div style={{ padding: "30px 22px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--success-subtle)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <div style={{ fontSize: 19, fontWeight: 800 }}>You&rsquo;re set</div>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300 }}>Payment confirmed. Your 48-hour window for <b style={{ color: "var(--text-primary)" }}>{f.title}</b> has started. <b style={{ color: "var(--success)" }}>{share}</b> goes to {f.creator}.</p>
            <button onClick={() => { closePay(); openPlayer(payFilmId); }} style={{ minHeight: 48, padding: "0 26px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 800, fontSize: 14, cursor: "pointer", marginTop: 6 }}>▶ Start watching</button>
            <button onClick={closePay} style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Later — it&rsquo;ll be in Continue Watching</button>
          </div>
        )}
      </div>
    </div>
  );
}
