import { useState, useRef, useEffect } from "react";

// ── Design tokens ──────────────────────────────────────────
const C = {
  navy:    "#05132B",
  navyMid: "#0C2444",
  navyLt:  "#1A3A6B",
  blue:    "#1B4FD8",
  blueLt:  "#3B73FF",
  gold:    "#D4A017",
  goldLt:  "#F0C040",
  goldPale:"#FDF3D0",
  white:   "#FFFFFF",
  offWhite:"#F4F6FB",
  slate:   "#94A3B8",
  border:  "#1E3A6A",
  textDark:"#0F1C2E",
  textMid: "#475569",
};

// ── System prompt ──────────────────────────────────────────
const SYSTEM_PROMPT = `You are CMA — Community Manager Assistant, created by Chosen Oruche, an experienced Community Manager with 4+ years of expertise. You help community managers with:

- Drafting announcements, newsletters, and community posts
- Handling member conflicts and moderation decisions
- Planning events and engagement campaigns
- Writing welcome messages, onboarding flows, and FAQs
- Measuring community health and engagement metrics
- Growing communities on Discord, Slack, Reddit, Facebook Groups, LinkedIn, Telegram, and more
- Crisis communication and community guidelines

Tone: Professional, direct, and practical. Give real, actionable advice — not generic tips. Keep responses concise but complete. When drafting content, make it copy-paste ready.`;

// ── Templates ──────────────────────────────────────────────
const TEMPLATES = [
  { icon: "👋", label: "Welcome Message", prompt: "Write a warm and professional welcome message for new members joining our community. Include a friendly intro, what to expect, and a call to action to introduce themselves." },
  { icon: "📢", label: "Community Announcement", prompt: "Draft a community announcement template for sharing important updates. Make it clear, engaging, and formatted for easy reading." },
  { icon: "⚠️", label: "Moderation Warning", prompt: "Write a firm but respectful warning message to a community member who violated our community guidelines. Don't name the rule specifically — keep it general." },
  { icon: "📅", label: "30-Day Engagement Plan", prompt: "Create a detailed 30-day community engagement plan with daily or weekly activities to boost member participation, retention, and growth." },
  { icon: "📋", label: "Community Guidelines", prompt: "Write a clear and professional set of community guidelines covering respect, spam, self-promotion, and moderation policy." },
  { icon: "📰", label: "Monthly Newsletter", prompt: "Draft a monthly community newsletter template with sections for highlights, upcoming events, member spotlight, and a closing note." },
  { icon: "🚨", label: "Crisis Response", prompt: "Write a crisis communication message for when something goes wrong in the community — a controversy, outage, or sensitive situation that needs a calm, transparent response." },
  { icon: "🎯", label: "Onboarding Flow", prompt: "Design a 3-step onboarding flow for new community members: what they should do in their first 24 hours, first week, and first month." },
];

const SUGGESTIONS = [
  "How do I handle a toxic member?",
  "Write a welcome message for new members",
  "How to grow a Discord server fast?",
  "Draft a member spotlight post",
];

export default function CMAssistant() {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [started, setStarted]         = useState(false);
  const [tab, setTab]                 = useState("chat"); // "chat" | "templates" | "saved"
  const [saved, setSaved]             = useState([]);
  const [copiedId, setCopiedId]       = useState(null);
  const [savedMsg, setSavedMsg]       = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    setStarted(true);
    setTab("chat");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: SYSTEM_PROMPT, messages: newMessages }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Something went wrong. Please try again.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveResponse = (msg, i) => {
    const entry = { id: Date.now(), content: msg.content, preview: msg.content.slice(0, 80) + "...", time: new Date().toLocaleDateString() };
    setSaved(prev => [entry, ...prev]);
    setSavedMsg(i);
    setTimeout(() => setSavedMsg(null), 2000);
  };

  // ── Shared styles ──
  const btn = (active) => ({
    background: active ? C.gold : "transparent",
    color: active ? C.navy : C.slate,
    border: "none", cursor: "pointer",
    padding: "8px 18px", borderRadius: "8px",
    fontSize: "13px", fontWeight: "600",
    transition: "all 0.15s",
  });

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: C.offWhite, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{ background: C.navy, borderBottom: `3px solid ${C.gold}`, padding: "0 28px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", background: `linear-gradient(135deg, ${C.gold}, ${C.goldLt})`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🏛️</div>
          <div>
            <div style={{ color: C.white, fontWeight: "800", fontSize: "15px", letterSpacing: "0.01em" }}>CMA <span style={{ color: C.gold, fontSize: "11px", fontWeight: "600", marginLeft: "6px", letterSpacing: "0.08em" }}>by Chosen Oruche</span></div>
            <div style={{ color: C.slate, fontSize: "11px", letterSpacing: "0.07em", textTransform: "uppercase" }}>Community Manager Assistant</div>
          </div>
        </div>
        {/* Nav tabs */}
        <div style={{ display: "flex", background: C.navyMid, borderRadius: "10px", padding: "4px", gap: "2px" }}>
          {["chat","templates","saved"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={btn(tab === t)}>
              {t === "chat" ? "💬 Chat" : t === "templates" ? "📋 Templates" : `💾 Saved${saved.length ? ` (${saved.length})` : ""}`}
            </button>
          ))}
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: "820px", width: "100%", margin: "0 auto", padding: "0 16px" }}>

        {/* ══ TEMPLATES TAB ══ */}
        {tab === "templates" && (
          <div style={{ padding: "28px 0" }}>
            <h2 style={{ color: C.textDark, fontSize: "20px", fontWeight: "800", margin: "0 0 6px" }}>Template Library</h2>
            <p style={{ color: C.textMid, fontSize: "13px", margin: "0 0 24px" }}>Click any template to send it straight to the AI.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => sendMessage(t.prompt)} style={{
                  background: C.white, border: `1.5px solid #DDE3EE`, borderRadius: "12px",
                  padding: "16px 18px", textAlign: "left", cursor: "pointer",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.boxShadow = `0 2px 16px rgba(212,160,23,0.15)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#DDE3EE"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ fontSize: "22px", marginBottom: "8px" }}>{t.icon}</div>
                  <div style={{ color: C.textDark, fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>{t.label}</div>
                  <div style={{ color: C.textMid, fontSize: "12px", lineHeight: "1.5" }}>{t.prompt.slice(0, 72)}…</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ SAVED TAB ══ */}
        {tab === "saved" && (
          <div style={{ padding: "28px 0" }}>
            <h2 style={{ color: C.textDark, fontSize: "20px", fontWeight: "800", margin: "0 0 6px" }}>Saved Responses</h2>
            <p style={{ color: C.textMid, fontSize: "13px", margin: "0 0 24px" }}>Responses you've saved from your chats.</p>
            {saved.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.slate }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
                <div style={{ fontWeight: "600", marginBottom: "6px" }}>Nothing saved yet</div>
                <div style={{ fontSize: "13px" }}>Hit the save button on any AI response in your chat.</div>
              </div>
            ) : saved.map((s) => (
              <div key={s.id} style={{ background: C.white, border: "1.5px solid #DDE3EE", borderRadius: "12px", padding: "16px 18px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <p style={{ color: C.textDark, fontSize: "13px", lineHeight: "1.6", margin: 0, flex: 1, whiteSpace: "pre-wrap" }}>{s.content}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                    <button onClick={() => copyText(s.content, s.id)} style={{ background: copiedId === s.id ? C.gold : C.navyMid, color: copiedId === s.id ? C.navy : C.white, border: "none", borderRadius: "7px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                      {copiedId === s.id ? "Copied!" : "Copy"}
                    </button>
                    <button onClick={() => setSaved(prev => prev.filter(x => x.id !== s.id))} style={{ background: "transparent", color: "#E53E3E", border: "1px solid #E53E3E", borderRadius: "7px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                      Delete
                    </button>
                  </div>
                </div>
                <div style={{ color: C.slate, fontSize: "11px", marginTop: "10px" }}>Saved · {s.time}</div>
              </div>
            ))}
          </div>
        )}

        {/* ══ CHAT TAB ══ */}
        {tab === "chat" && (
          <>
            {!started ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0 32px" }}>
                <div style={{ width: "72px", height: "72px", background: `linear-gradient(135deg, ${C.navy}, ${C.navyLt})`, borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "34px", marginBottom: "20px", boxShadow: `0 6px 28px rgba(212,160,23,0.2)` }}>🏛️</div>
                <h1 style={{ color: C.textDark, fontSize: "26px", fontWeight: "800", margin: "0 0 8px", textAlign: "center", letterSpacing: "-0.02em" }}>Community Manager Assistant</h1>
                <p style={{ color: C.textMid, fontSize: "14px", margin: "0 0 6px", textAlign: "center" }}>Built by <span style={{ color: C.blue, fontWeight: "700" }}>Chosen Oruche</span> · 4+ years in community management</p>
                <p style={{ color: C.slate, fontSize: "13px", margin: "0 0 36px", textAlign: "center", maxWidth: "400px", lineHeight: "1.6" }}>Drafts, strategies, moderation playbooks, and engagement plans — ready when you need them.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%", maxWidth: "560px" }}>
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)} style={{ background: C.white, border: `1.5px solid #DDE3EE`, borderRadius: "10px", padding: "12px 16px", textAlign: "left", cursor: "pointer", fontSize: "13px", color: C.textDark, fontWeight: "500", lineHeight: "1.4", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = C.goldPale; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#DDE3EE"; e.currentTarget.style.background = C.white; }}
                    >{s}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, padding: "24px 0 8px", display: "flex", flexDirection: "column", gap: "20px" }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: "10px" }}>
                    {msg.role === "assistant" && (
                      <div style={{ width: "32px", height: "32px", background: `linear-gradient(135deg,${C.gold},${C.goldLt})`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0, marginTop: "2px" }}>🏛️</div>
                    )}
                    <div style={{ maxWidth: "78%" }}>
                      <div style={{ background: msg.role === "user" ? `linear-gradient(135deg,${C.navy},${C.navyLt})` : C.white, color: msg.role === "user" ? C.white : C.textDark, borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "12px 16px", fontSize: "14px", lineHeight: "1.65", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: msg.role === "assistant" ? "1.5px solid #DDE3EE" : "none", whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </div>
                      {msg.role === "assistant" && (
                        <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                          <button onClick={() => copyText(msg.content, i)} style={{ background: copiedId === i ? C.gold : "transparent", color: copiedId === i ? C.navy : C.slate, border: `1px solid ${copiedId === i ? C.gold : "#DDE3EE"}`, borderRadius: "6px", padding: "4px 10px", fontSize: "11px", cursor: "pointer", fontWeight: "600", transition: "all 0.15s" }}>
                            {copiedId === i ? "✓ Copied" : "Copy"}
                          </button>
                          <button onClick={() => saveResponse(msg, i)} style={{ background: savedMsg === i ? C.goldPale : "transparent", color: savedMsg === i ? C.gold : C.slate, border: `1px solid ${savedMsg === i ? C.gold : "#DDE3EE"}`, borderRadius: "6px", padding: "4px 10px", fontSize: "11px", cursor: "pointer", fontWeight: "600", transition: "all 0.15s" }}>
                            {savedMsg === i ? "✓ Saved" : "Save"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", background: `linear-gradient(135deg,${C.gold},${C.goldLt})`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>🏛️</div>
                    <div style={{ background: C.white, border: "1.5px solid #DDE3EE", borderRadius: "18px 18px 18px 4px", padding: "12px 20px", display: "flex", gap: "5px", alignItems: "center" }}>
                      {[0,1,2].map(j => <div key={j} style={{ width: "7px", height: "7px", borderRadius: "50%", background: C.gold, animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${j*0.2}s` }} />)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            {/* Input */}
            <div style={{ position: "sticky", bottom: 0, background: C.offWhite, paddingTop: "12px", paddingBottom: "20px" }}>
              <div style={{ display: "flex", background: C.white, border: `1.5px solid #DDE3EE`, borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                  placeholder="Ask about moderation, engagement, content drafts, community growth..."
                  rows={1} style={{ flex: 1, border: "none", outline: "none", padding: "14px 16px", fontSize: "14px", fontFamily: "inherit", color: C.textDark, background: "transparent", resize: "none", lineHeight: "1.5" }} />
                <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ background: loading || !input.trim() ? "#CBD5E1" : `linear-gradient(135deg,${C.gold},${C.goldLt})`, border: "none", borderRadius: "0 12px 12px 0", padding: "0 22px", cursor: loading || !input.trim() ? "default" : "pointer", color: C.navy, fontSize: "18px", fontWeight: "800", transition: "background 0.15s" }}>↑</button>
              </div>
              <p style={{ textAlign: "center", color: C.slate, fontSize: "11px", margin: "8px 0 0", letterSpacing: "0.02em" }}>CMA by Chosen Oruche · Press Enter to send</p>
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)} }
        *{box-sizing:border-box} body{margin:0}
        textarea{min-height:48px;max-height:140px;overflow-y:auto}
      `}</style>
    </div>
  );
}
