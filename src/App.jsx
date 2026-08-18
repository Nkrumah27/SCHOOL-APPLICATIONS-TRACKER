import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, X, Check, ChevronLeft, GraduationCap, User, LayoutGrid,
  Trash2, Sparkles, Send, Loader2, CalendarClock, StickyNote,
  ListChecks, Pencil, AlertCircle, Paperclip, Search, FileText, Compass
} from "lucide-react";

/* ---------------------------------------------------------------
   TOKENS
   ink        #1B2A4A   deep navy — headers, primary chrome
   parchment  #F2EAD8   warm paper background
   parchment2 #E8DEC4   deeper paper — card wells
   brass      #AD8A4E   accent — actions, seals
   sage       #5E7F5E   accepted / done
   rust       #A54332   deadlines / rejected / urgent
   ink-70     rgba ink at 70% — secondary text
   Fraunces (display serif) / Inter (body) / IBM Plex Mono (data & dates)
------------------------------------------------------------------*/

const FONTS = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    .mat-root {
      --ink: #1B2A4A;
      --ink-70: rgba(27,42,74,0.68);
      --ink-40: rgba(27,42,74,0.35);
      --parchment: #F2EAD8;
      --parchment2: #E8DEC4;
      --parchment3: #DED2AE;
      --brass: #AD8A4E;
      --brass-dark: #8C6E38;
      --sage: #5E7F5E;
      --sage-bg: #E3EBDF;
      --rust: #A54332;
      --rust-bg: #F3E2DC;
      --amber: #B8863B;
      --amber-bg: #F2E6CE;
      font-family: 'Inter', sans-serif;
      color: var(--ink);
      background: var(--parchment);
      min-height: 100%;
    }
    .mat-root .font-display { font-family: 'Fraunces', serif; }
    .mat-root .font-mono { font-family: 'IBM Plex Mono', monospace; }

    .mat-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .mat-scroll::-webkit-scrollbar-thumb { background: var(--parchment3); border-radius: 4px; }
    .mat-scroll::-webkit-scrollbar-track { background: transparent; }

    @keyframes matFadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .mat-fade-up { animation: matFadeUp 0.45s cubic-bezier(.22,1,.36,1) both; }

    @keyframes matStamp {
      0% { opacity: 0; transform: scale(2.2) rotate(-14deg); }
      60% { opacity: 1; }
      100% { opacity: 1; transform: scale(1) rotate(-8deg); }
    }
    .mat-stamp { animation: matStamp 0.5s cubic-bezier(.2,1.4,.4,1) both; }

    .mat-card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .mat-card-hover:hover { transform: translateY(-3px); box-shadow: 0 14px 28px -14px rgba(27,42,74,0.35); }

    .mat-focus:focus-visible { outline: 2px solid var(--brass); outline-offset: 2px; }

    .mat-input {
      background: #fff;
      border: 1px solid var(--parchment3);
      border-radius: 8px;
      padding: 9px 12px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: var(--ink);
      width: 100%;
    }
    .mat-input:focus { outline: 2px solid var(--brass); outline-offset: 0; border-color: var(--brass); }
    .mat-input::placeholder { color: var(--ink-40); }

    @media (prefers-reduced-motion: reduce) {
      .mat-fade-up, .mat-stamp, .mat-card-hover { animation: none !important; transition: none !important; }
    }
  `}</style>
);

const STATUS_META = {
  researching: { label: "Researching", color: "var(--ink-70)", bg: "#E4E2D8", border: "var(--ink-40)" },
  preparing:   { label: "Preparing",   color: "var(--amber)", bg: "var(--amber-bg)", border: "var(--amber)" },
  submitted:   { label: "Submitted",   color: "var(--brass-dark)", bg: "#EFE4CB", border: "var(--brass)" },
  interview:   { label: "Interview",   color: "#5A5AA0", bg: "#E5E3F2", border: "#5A5AA0" },
  accepted:    { label: "Accepted",    color: "var(--sage)", bg: "var(--sage-bg)", border: "var(--sage)" },
  waitlisted:  { label: "Waitlisted",  color: "var(--amber)", bg: "var(--amber-bg)", border: "var(--amber)" },
  rejected:    { label: "Rejected",    color: "var(--rust)", bg: "var(--rust-bg)", border: "var(--rust)" },
};
const STATUS_ORDER = ["researching", "preparing", "submitted", "interview", "waitlisted", "accepted", "rejected"];

const DEFAULT_TODOS = [
  "Request transcripts",
  "Request 2–3 recommendation letters",
  "Draft statement of purpose",
  "Take/report English test (if required)",
  "Pay application fee",
  "Submit application",
];

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function DeadlineBadge({ deadline }) {
  if (!deadline) return (
    <span className="font-mono text-[11px] tracking-wide" style={{ color: "var(--ink-40)" }}>NO DEADLINE SET</span>
  );
  const d = daysUntil(deadline);
  let tone = "var(--ink-70)";
  let text = `${d} days left`;
  if (d < 0) { tone = "var(--rust)"; text = `${Math.abs(d)} days overdue`; }
  else if (d === 0) { tone = "var(--rust)"; text = "due today"; }
  else if (d <= 14) { tone = "var(--amber)"; text = `${d} days left`; }
  return (
    <span className="font-mono text-[11px] tracking-wide flex items-center gap-1" style={{ color: tone }}>
      <CalendarClock size={12} strokeWidth={2} />
      {new Date(deadline + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      <span style={{ opacity: 0.75 }}>· {text}</span>
    </span>
  );
}

function Stamp({ status }) {
  const meta = STATUS_META[status] || STATUS_META.researching;
  return (
    <div
      className="mat-stamp font-mono select-none"
      style={{
        transform: "rotate(-8deg)",
        border: `2px solid ${meta.border}`,
        color: meta.color,
        borderRadius: 999,
        padding: "3px 11px",
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.12em",
        background: meta.bg,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label.toUpperCase()}
    </div>
  );
}

/* ---------------------------------------------------------------
   STORAGE HOOK
------------------------------------------------------------------*/
function useStoredState(key, fallback) {
  const [value, setValue] = useState(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch (e) {
      console.error("storage load failed", key, e);
    }
    setLoaded(true);
  }, [key]);

  const persist = useCallback((next) => {
    setValue(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch (e) {
      console.error("storage save failed", key, e);
    }
  }, [key]);

  return [value, persist, loaded];
}

/* ---------------------------------------------------------------
   ADD / EDIT SCHOOL FORM
------------------------------------------------------------------*/
function SchoolForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [course, setCourse] = useState(initial?.course || "");
  const [deadline, setDeadline] = useState(initial?.deadline || "");
  const [status, setStatus] = useState(initial?.status || "researching");
  const [notes, setNotes] = useState(initial?.notes || "");
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const canSave = name.trim().length > 0 && course.trim().length > 0;

  return (
    <div className="mat-fade-up" style={{ background: "#fff", border: "1px solid var(--parchment3)", borderRadius: 14, padding: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg" style={{ fontWeight: 600 }}>
          {initial ? "Edit school" : "Add a school"}
        </h3>
        <button onClick={onCancel} className="mat-focus" style={{ color: "var(--ink-40)" }} aria-label="Cancel">
          <X size={18} />
        </button>
      </div>
      <div className="grid gap-3">
        <div>
          <label className="font-mono text-[10px] tracking-wide" style={{ color: "var(--ink-70)" }}>SCHOOL NAME</label>
          <input ref={nameRef} className="mat-input mat-focus mt-1" placeholder="e.g. University of Edinburgh"
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="font-mono text-[10px] tracking-wide" style={{ color: "var(--ink-70)" }}>COURSE / PROGRAM</label>
          <input className="mat-input mat-focus mt-1" placeholder="e.g. MSc Artificial Intelligence"
            value={course} onChange={(e) => setCourse(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono text-[10px] tracking-wide" style={{ color: "var(--ink-70)" }}>DEADLINE</label>
            <input type="date" className="mat-input mat-focus mt-1" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="font-mono text-[10px] tracking-wide" style={{ color: "var(--ink-70)" }}>STATUS</label>
            <select className="mat-input mat-focus mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="font-mono text-[10px] tracking-wide" style={{ color: "var(--ink-70)" }}>NOTES</label>
          <textarea className="mat-input mat-focus mt-1" rows={3} placeholder="Funding notes, contacts, program quirks…"
            value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onCancel} className="mat-focus px-4 py-2 rounded-lg text-sm font-medium" style={{ color: "var(--ink-70)" }}>
          Cancel
        </button>
        <button
          disabled={!canSave}
          onClick={() => onSave({
            id: initial?.id || uid(),
            name: name.trim(), course: course.trim(), deadline, status, notes,
            todos: initial?.todos || DEFAULT_TODOS.map((t) => ({ id: uid(), text: t, done: false })),
            createdAt: initial?.createdAt || Date.now(),
          })}
          className="mat-focus px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: canSave ? "var(--ink)" : "var(--ink-40)", color: "var(--parchment)" }}
        >
          {initial ? "Save changes" : "Add to board"}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   SCHOOL CARD (board view)
------------------------------------------------------------------*/
function SchoolCard({ school, onOpen }) {
  const done = school.todos.filter((t) => t.done).length;
  const total = school.todos.length || 1;
  const pct = Math.round((done / total) * 100);
  return (
    <button
      onClick={onOpen}
      className="mat-card-hover mat-focus mat-fade-up text-left"
      style={{
        background: "#fff",
        border: "1px solid var(--parchment3)",
        borderRadius: 14,
        padding: "18px 18px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 14, right: 14 }}>
        <Stamp status={school.status} />
      </div>
      <div className="font-mono text-[10px] tracking-widest" style={{ color: "var(--brass-dark)" }}>
        {school.course.toUpperCase()}
      </div>
      <div className="font-display text-xl mt-1 pr-24" style={{ fontWeight: 600, lineHeight: 1.15 }}>
        {school.name}
      </div>
      <div className="mt-3"><DeadlineBadge deadline={school.deadline} /></div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[10px] tracking-wide" style={{ color: "var(--ink-70)" }}>
            {done}/{school.todos.length} TASKS
          </span>
          <span className="font-mono text-[10px]" style={{ color: "var(--ink-70)" }}>{pct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "var(--parchment2)" }}>
          <div style={{ height: 5, borderRadius: 3, width: `${pct}%`, background: "var(--brass)", transition: "width .3s ease" }} />
        </div>
      </div>
    </button>
  );
}

/* ---------------------------------------------------------------
   FILE ATTACHMENT HELPERS
------------------------------------------------------------------*/
const ACCEPTED_TEXT_TYPES = ["text/plain", "text/markdown", "text/csv"];
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
}
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("read failed"));
    r.readAsText(file);
  });
}

async function filesToAttachments(fileList) {
  const out = [];
  for (const file of Array.from(fileList)) {
    try {
      if (file.type === "application/pdf") {
        out.push({ id: uid(), name: file.name, kind: "pdf", mediaType: file.type, base64: await readFileAsBase64(file) });
      } else if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        out.push({ id: uid(), name: file.name, kind: "image", mediaType: file.type, base64: await readFileAsBase64(file) });
      } else if (ACCEPTED_TEXT_TYPES.includes(file.type) || /\.(txt|md)$/i.test(file.name)) {
        out.push({ id: uid(), name: file.name, kind: "text", text: await readFileAsText(file) });
      } else {
        out.push({ id: uid(), name: file.name, kind: "unsupported" });
      }
    } catch (e) {
      out.push({ id: uid(), name: file.name, kind: "unsupported" });
    }
  }
  return out;
}

function attachmentsToApiBlocks(attachments) {
  return attachments
    .filter((a) => a.kind !== "unsupported")
    .map((a) => {
      if (a.kind === "image") return { type: "image", source: { type: "base64", media_type: a.mediaType, data: a.base64 } };
      if (a.kind === "pdf") return { type: "document", source: { type: "base64", media_type: a.mediaType, data: a.base64 } };
      return { type: "text", text: `--- Attached file: ${a.name} ---\n${a.text}\n--- end of ${a.name} ---` };
    });
}

function AttachmentChip({ name, kind, onRemove }) {
  return (
    <div className="flex items-center gap-1.5 text-xs" style={{
      background: "var(--parchment2)", borderRadius: 7, padding: "4px 8px", maxWidth: 180,
    }}>
      <FileText size={12} style={{ flexShrink: 0 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      {onRemove && <button onClick={onRemove} className="mat-focus" style={{ flexShrink: 0, color: "var(--ink-70)" }} aria-label={`Remove ${name}`}><X size={12} /></button>}
    </div>
  );
}

/* ---------------------------------------------------------------
   AI ASSISTANT PANEL (per-school — essays, SOPs, LORs, interviews, general Q&A)
------------------------------------------------------------------*/
function AssistantChat({ school, profile, chat, setChat }) {
  const [input, setInput] = useState("");
  const [pending, setPending] = useState([]); // attachments staged for the next message
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, loading]);

  const profileSummary = `
Applicant profile (use this to personalize advice; never invent facts not given here):
- Name: ${profile.name || "(not provided)"}
- Current education / background: ${profile.background || "(not provided)"}
- Target field / career goals: ${profile.goals || "(not provided)"}
- Key achievements / experience: ${profile.achievements || "(not provided)"}
- Writing tendencies to watch for: ${profile.writingNotes || "(not provided)"}
`.trim();

  const schoolSummary = `
Target program:
- School: ${school.name}
- Course: ${school.course}
- Deadline: ${school.deadline || "(not set)"}
- Notes: ${school.notes || "(none)"}
`.trim();

  const SYSTEM = `You are the applicant's admissions assistant for this specific program. Help with every part of the application, not only essays: statements of purpose, CV/resume wording, choosing and briefing recommenders, interview prep, deciding what to highlight, reading and reacting to uploaded drafts or documents (PDFs, images of transcripts, notes), and general questions about the program or process. Be specific, honest, and concrete — point out weak or generic writing and suggest sharper alternatives. Ask a clarifying question when you need more detail instead of inventing facts about the applicant. Never fabricate achievements, dates, or facts the applicant hasn't given you.

${profileSummary}

${schoolSummary}`;

  async function send() {
    const text = input.trim();
    if ((!text && pending.length === 0) || loading) return;
    setError(null);

    const attachmentBlocks = attachmentsToApiBlocks(pending);
    const unsupported = pending.filter((a) => a.kind === "unsupported");
    const displayText = text + (pending.length ? `\n\n[Attached: ${pending.map((a) => a.name).join(", ")}]` : "");

    const historyForApi = chat.map((m) => ({ role: m.role, content: m.content }));
    const currentContent = attachmentBlocks.length
      ? [...attachmentBlocks, { type: "text", text: text || "Please review the attached file(s)." }]
      : text;

    const nextChatDisplay = [...chat, { role: "user", content: displayText }];
    setChat(nextChatDisplay);
    setInput("");
    setPending([]);
    setLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 1200,
          system: SYSTEM,
          messages: [...historyForApi, { role: "user", content: currentContent }],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "request failed");
      const replyText = (data.content || [])
        .map((b) => (b.type === "text" ? b.text : ""))
        .filter(Boolean)
        .join("\n");
      let finalReply = replyText || "(no response)";
      if (unsupported.length) {
        finalReply += `\n\n(Couldn't read ${unsupported.map((a) => a.name).join(", ")} — try a .txt, .md, .pdf, or image file.)`;
      }
      setChat([...nextChatDisplay, { role: "assistant", content: finalReply }]);
    } catch (e) {
      setError("Couldn't reach the assistant. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    const atts = await filesToAttachments(fileList);
    setPending((p) => [...p, ...atts]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div ref={scrollRef} className="mat-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 2px" }}>
        {chat.length === 0 && (
          <div style={{ background: "var(--parchment2)", borderRadius: 10, padding: 14 }} className="text-sm">
            <div className="flex items-center gap-2 font-medium mb-1" style={{ color: "var(--ink)" }}>
              <Sparkles size={14} /> AI assistant
            </div>
            <p style={{ color: "var(--ink-70)" }}>
              Ask for help with essays, your SOP, what to ask a recommender, interview prep, or anything else about
              applying to {school.name}. Attach a draft, transcript, or image with the paperclip below — it uses your
              profile plus this program's info as context.
            </p>
          </div>
        )}
        <div className="flex flex-col gap-3 mt-3">
          {chat.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                className="text-sm"
                style={{
                  maxWidth: "88%",
                  whiteSpace: "pre-wrap",
                  padding: "9px 13px",
                  borderRadius: 12,
                  background: m.role === "user" ? "var(--ink)" : "#fff",
                  color: m.role === "user" ? "var(--parchment)" : "var(--ink)",
                  border: m.role === "user" ? "none" : "1px solid var(--parchment3)",
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-70)" }}>
              <Loader2 size={14} className="animate-spin" /> thinking…
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--rust)" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {pending.map((a) => (
            <AttachmentChip key={a.id} name={a.name} kind={a.kind} onRemove={() => setPending((p) => p.filter((x) => x.id !== a.id))} />
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 pt-3" style={{ borderTop: "1px solid var(--parchment3)" }}>
        <input ref={fileInputRef} type="file" multiple accept=".txt,.md,.pdf,image/png,image/jpeg,image/webp,image/gif"
          style={{ display: "none" }} onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
        <button onClick={() => fileInputRef.current?.click()} className="mat-focus" aria-label="Attach file"
          style={{ color: "var(--ink-70)", padding: 10, flexShrink: 0 }}>
          <Paperclip size={17} />
        </button>
        <textarea
          rows={2}
          className="mat-input mat-focus"
          placeholder="Ask for help with anything about this application…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button
          onClick={send}
          disabled={loading || (!input.trim() && pending.length === 0)}
          className="mat-focus"
          style={{
            background: "var(--brass)", color: "#fff", borderRadius: 10,
            padding: 10, opacity: loading || (!input.trim() && pending.length === 0) ? 0.5 : 1, flexShrink: 0,
          }}
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   SCHOOL DETAIL VIEW
------------------------------------------------------------------*/
function SchoolDetail({ school, onBack, onUpdate, onDelete, profile }) {
  const [editing, setEditing] = useState(false);
  const [newTodo, setNewTodo] = useState("");
  const [tab, setTab] = useState("todos"); // todos | notes | assistant
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [chat, setChat, chatLoaded] = useStoredState(`essay-chat:${school.id}`, []);

  function toggleTodo(id) {
    onUpdate({ ...school, todos: school.todos.map((t) => t.id === id ? { ...t, done: !t.done } : t) });
  }
  function removeTodo(id) {
    onUpdate({ ...school, todos: school.todos.filter((t) => t.id !== id) });
  }
  function addTodo() {
    const text = newTodo.trim();
    if (!text) return;
    onUpdate({ ...school, todos: [...school.todos, { id: uid(), text, done: false }] });
    setNewTodo("");
  }

  if (editing) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <SchoolForm initial={school} onCancel={() => setEditing(false)}
          onSave={(s) => { onUpdate(s); setEditing(false); }} />
      </div>
    );
  }

  const done = school.todos.filter((t) => t.done).length;

  return (
    <div className="mat-fade-up">
      <button onClick={onBack} className="mat-focus flex items-center gap-1 text-sm mb-4" style={{ color: "var(--ink-70)" }}>
        <ChevronLeft size={16} /> Board
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3 mb-1">
        <div>
          <div className="font-mono text-[11px] tracking-widest" style={{ color: "var(--brass-dark)" }}>
            {school.course.toUpperCase()}
          </div>
          <h2 className="font-display text-3xl mt-1" style={{ fontWeight: 700 }}>{school.name}</h2>
          <div className="mt-2"><DeadlineBadge deadline={school.deadline} /></div>
        </div>
        <div className="flex items-center gap-3">
          <Stamp status={school.status} />
          <button onClick={() => setEditing(true)} className="mat-focus" style={{ color: "var(--ink-70)" }} aria-label="Edit school">
            <Pencil size={17} />
          </button>
          {!confirmingDelete ? (
            <button onClick={() => setConfirmingDelete(true)} className="mat-focus" style={{ color: "var(--rust)" }} aria-label="Delete school">
              <Trash2 size={17} />
            </button>
          ) : (
            <div className="mat-fade-up flex items-center gap-2 text-sm" style={{
              background: "var(--rust-bg)", border: "1px solid var(--rust)", borderRadius: 8, padding: "5px 8px",
            }}>
              <span style={{ color: "var(--rust)" }}>Remove this school?</span>
              <button onClick={() => onDelete(school.id)} className="mat-focus font-semibold" style={{ color: "var(--rust)" }}>
                Delete
              </button>
              <button onClick={() => setConfirmingDelete(false)} className="mat-focus" style={{ color: "var(--ink-70)" }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 mt-6 mb-4" style={{ borderBottom: "1px solid var(--parchment3)" }}>
        {[
          { id: "todos", label: `To-do (${done}/${school.todos.length})`, icon: ListChecks },
          { id: "notes", label: "Notes", icon: StickyNote },
          { id: "assistant", label: "AI assistant", icon: Sparkles },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="mat-focus flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium"
            style={{
              color: tab === t.id ? "var(--ink)" : "var(--ink-70)",
              borderBottom: tab === t.id ? "2px solid var(--brass)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "todos" && (
        <div className="grid gap-2" style={{ maxWidth: 560 }}>
          {school.todos.map((t) => (
            <div key={t.id} className="flex items-center gap-3 group" style={{
              background: "#fff", border: "1px solid var(--parchment3)", borderRadius: 10, padding: "9px 12px",
            }}>
              <button onClick={() => toggleTodo(t.id)} className="mat-focus" aria-label={t.done ? "Mark not done" : "Mark done"}
                style={{
                  width: 19, height: 19, borderRadius: 6, flexShrink: 0,
                  border: `2px solid ${t.done ? "var(--sage)" : "var(--parchment3)"}`,
                  background: t.done ? "var(--sage)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                {t.done && <Check size={13} color="#fff" strokeWidth={3} />}
              </button>
              <span className="text-sm flex-1" style={{
                textDecoration: t.done ? "line-through" : "none",
                color: t.done ? "var(--ink-40)" : "var(--ink)",
              }}>{t.text}</span>
              <button onClick={() => removeTodo(t.id)} className="mat-focus" style={{ color: "var(--ink-40)" }} aria-label="Remove task">
                <X size={15} />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1">
            <input className="mat-input mat-focus" placeholder="Add a task…" value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()} />
            <button onClick={addTodo} className="mat-focus" style={{ background: "var(--ink)", color: "#fff", borderRadius: 8, padding: "9px 12px" }}>
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      {tab === "notes" && (
        <div style={{ maxWidth: 560 }}>
          <textarea
            className="mat-input mat-focus"
            rows={10}
            placeholder="Funding details, contacts, interview impressions, program quirks…"
            value={school.notes}
            onChange={(e) => onUpdate({ ...school, notes: e.target.value })}
          />
        </div>
      )}

      {tab === "assistant" && (
        <div style={{ maxWidth: 640, height: 520, background: "#fff", border: "1px solid var(--parchment3)", borderRadius: 14, padding: 16 }}>
          {chatLoaded && <AssistantChat school={school} profile={profile} chat={chat} setChat={setChat} />}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   DISCOVER — general assistant that searches the web for schools
------------------------------------------------------------------*/
function DiscoverView({ profile, schools }) {
  const [chat, setChat, loaded] = useStoredState("discover-chat", []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, loading]);

  const profileSummary = `
Applicant profile:
- Current education / background: ${profile.background || "(not provided)"}
- Target field / career goals: ${profile.goals || "(not provided)"}
- Key achievements / experience: ${profile.achievements || "(not provided)"}
`.trim();

  const boardSummary = schools.length
    ? `Schools already on their board: ${schools.map((s) => `${s.name} (${s.course})`).join("; ")}.`
    : "Their board is currently empty.";

  const SYSTEM = `You are a master's program discovery assistant. Use web search to find real, currently-offered programs that match what the applicant asks for — country/region, field, funding, rankings, deadlines, entry requirements, etc. Recommend specific universities and program names, briefly say why each fits, and flag anything time-sensitive (e.g. deadlines) worth double-checking on the official page. Don't invent programs or details — search for them. Keep answers organized and skimmable, not walls of text.

${profileSummary}
${boardSummary}`;

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const nextChat = [...chat, { role: "user", content: text }];
    setChat(nextChat);
    setLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 1500,
          system: SYSTEM,
          messages: nextChat.map((m) => ({ role: m.role, content: m.content })),
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "request failed");
      const replyText = (data.content || [])
        .map((b) => (b.type === "text" ? b.text : ""))
        .filter(Boolean)
        .join("\n");
      setChat([...nextChat, { role: "assistant", content: replyText || "(no response)" }]);
    } catch (e) {
      setError("Couldn't reach the assistant. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mat-fade-up" style={{ maxWidth: 680 }}>
      <h2 className="font-display text-2xl flex items-center gap-2" style={{ fontWeight: 700 }}>
        <Compass size={22} /> Discover schools
      </h2>
      <p className="text-sm mt-1 mb-5" style={{ color: "var(--ink-70)" }}>
        Describe what you're looking for — field, country, funding, rankings — and this searches the web for real,
        current programs. It uses your profile as context too.
      </p>

      <div style={{ height: 480, background: "#fff", border: "1px solid var(--parchment3)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column" }}>
        <div ref={scrollRef} className="mat-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 2px" }}>
          {loaded && chat.length === 0 && (
            <div style={{ background: "var(--parchment2)", borderRadius: 10, padding: 14 }} className="text-sm">
              <div className="flex items-center gap-2 font-medium mb-1" style={{ color: "var(--ink)" }}>
                <Search size={14} /> Try asking…
              </div>
              <p style={{ color: "var(--ink-70)" }}>
                "Fully-funded AI master's programs in Europe for a CS grad" or "UK universities strong in HCI with
                January intake" or "compare funding options for a public policy master's in Canada vs Germany."
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3 mt-3">
            {chat.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div className="text-sm" style={{
                  maxWidth: "90%", whiteSpace: "pre-wrap", padding: "9px 13px", borderRadius: 12,
                  background: m.role === "user" ? "var(--ink)" : "#fff",
                  color: m.role === "user" ? "var(--parchment)" : "var(--ink)",
                  border: m.role === "user" ? "none" : "1px solid var(--parchment3)",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-70)" }}>
                <Loader2 size={14} className="animate-spin" /> searching…
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--rust)" }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-end gap-2 pt-3" style={{ borderTop: "1px solid var(--parchment3)" }}>
          <textarea
            rows={2}
            className="mat-input mat-focus"
            placeholder="What kind of program are you looking for?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="mat-focus"
            style={{ background: "var(--brass)", color: "#fff", borderRadius: 10, padding: 10, opacity: loading || !input.trim() ? 0.5 : 1, flexShrink: 0 }}
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--ink-40)" }}>
        Once you've found a program you like, head to the Board to add it and start its checklist.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------
   PROFILE VIEW
------------------------------------------------------------------*/
function ProfileView({ profile, onChange }) {
  const fields = [
    { key: "name", label: "Name", type: "input", placeholder: "Your full name" },
    { key: "background", label: "Current education / background", type: "textarea", placeholder: "e.g. BSc Computer Science, XYZ University, graduating 2026. Relevant coursework, GPA if you want to reference it…" },
    { key: "goals", label: "Target field & career goals", type: "textarea", placeholder: "What you want to study and why, where you see this leading…" },
    { key: "achievements", label: "Key achievements / experience", type: "textarea", placeholder: "Projects, research, internships, leadership, publications, awards…" },
    { key: "writingNotes", label: "Writing tendencies to watch for", type: "textarea", placeholder: "e.g. I tend to be too formal / I ramble in intros / English is my second language…" },
  ];
  return (
    <div className="mat-fade-up" style={{ maxWidth: 620 }}>
      <h2 className="font-display text-2xl" style={{ fontWeight: 700 }}>Your profile</h2>
      <p className="text-sm mt-1 mb-6" style={{ color: "var(--ink-70)" }}>
        This context is shared with the essay assistant on every school so its suggestions sound like you, not a template.
      </p>
      <div className="grid gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="font-mono text-[10px] tracking-wide" style={{ color: "var(--ink-70)" }}>{f.label.toUpperCase()}</label>
            {f.type === "input" ? (
              <input className="mat-input mat-focus mt-1" placeholder={f.placeholder}
                value={profile[f.key] || ""} onChange={(e) => onChange({ ...profile, [f.key]: e.target.value })} />
            ) : (
              <textarea className="mat-input mat-focus mt-1" rows={3} placeholder={f.placeholder}
                value={profile[f.key] || ""} onChange={(e) => onChange({ ...profile, [f.key]: e.target.value })} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   APP
------------------------------------------------------------------*/
export default function App() {
  const [schools, setSchools, schoolsLoaded] = useStoredState("schools", []);
  const [profile, setProfile] = useStoredState("profile", {});
  const [view, setView] = useState("board"); // board | discover | profile
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);

  const openSchool = schools.find((s) => s.id === openId);

  function updateSchool(next) {
    setSchools(schools.map((s) => (s.id === next.id ? next : s)));
  }
  function deleteSchool(id) {
    setSchools(schools.filter((s) => s.id !== id));
    setOpenId(null);
  }
  function addSchool(s) {
    setSchools([s, ...schools]);
    setAdding(false);
  }

  const sorted = [...schools].sort((a, b) => {
    const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
    return da - db;
  });

  return (
    <div className="mat-root" style={{ minHeight: "100%", width: "100%" }}>
      {FONTS}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 20px 60px" }}>
        <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div style={{ background: "var(--ink)", borderRadius: 10, padding: 8, display: "flex" }}>
              <GraduationCap size={20} color="var(--parchment)" />
            </div>
            <div>
              <div className="font-display text-xl" style={{ fontWeight: 700, lineHeight: 1 }}>Application Desk</div>
              <div className="font-mono text-[10px] tracking-wide" style={{ color: "var(--ink-70)" }}>MASTER'S APPLICATIONS TRACKER</div>
            </div>
          </div>
          <nav className="flex items-center gap-1" style={{ background: "#fff", border: "1px solid var(--parchment3)", borderRadius: 10, padding: 3 }}>
            <button onClick={() => { setView("board"); setOpenId(null); }} className="mat-focus flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: view === "board" ? "var(--ink)" : "transparent", color: view === "board" ? "var(--parchment)" : "var(--ink-70)" }}>
              <LayoutGrid size={14} /> Board
            </button>
            <button onClick={() => { setView("discover"); setOpenId(null); }} className="mat-focus flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: view === "discover" ? "var(--ink)" : "transparent", color: view === "discover" ? "var(--parchment)" : "var(--ink-70)" }}>
              <Compass size={14} /> Discover
            </button>
            <button onClick={() => setView("profile")} className="mat-focus flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: view === "profile" ? "var(--ink)" : "transparent", color: view === "profile" ? "var(--parchment)" : "var(--ink-70)" }}>
              <User size={14} /> Profile
            </button>
          </nav>
        </header>

        {!schoolsLoaded ? (
          <div className="text-sm" style={{ color: "var(--ink-70)" }}>Loading your board…</div>
        ) : view === "profile" ? (
          <ProfileView profile={profile} onChange={setProfile} />
        ) : view === "discover" ? (
          <DiscoverView profile={profile} schools={schools} />
        ) : openSchool ? (
          <SchoolDetail school={openSchool} onBack={() => setOpenId(null)} onUpdate={updateSchool} onDelete={deleteSchool} profile={profile} />
        ) : adding ? (
          <div style={{ maxWidth: 560 }}><SchoolForm onCancel={() => setAdding(false)} onSave={addSchool} /></div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-display text-2xl" style={{ fontWeight: 700 }}>
                Your board {schools.length > 0 && <span style={{ color: "var(--ink-40)" }}>· {schools.length}</span>}
              </h1>
              <button onClick={() => setAdding(true)} className="mat-focus flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "var(--brass)", color: "#fff" }}>
                <Plus size={15} /> Add school
              </button>
            </div>

            {schools.length === 0 ? (
              <div className="mat-fade-up" style={{
                border: "1px dashed var(--parchment3)", borderRadius: 14, padding: "48px 24px", textAlign: "center", background: "#fff",
              }}>
                <GraduationCap size={26} style={{ color: "var(--ink-40)", margin: "0 auto 10px" }} />
                <p className="font-display text-lg" style={{ fontWeight: 600 }}>No schools on your board yet</p>
                <p className="text-sm mt-1 mb-4" style={{ color: "var(--ink-70)" }}>Add the first program you're applying to and its deadline.</p>
                <button onClick={() => setAdding(true)} className="mat-focus px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: "var(--ink)", color: "var(--parchment)" }}>
                  Add a school
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {sorted.map((s) => <SchoolCard key={s.id} school={s} onOpen={() => setOpenId(s.id)} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
