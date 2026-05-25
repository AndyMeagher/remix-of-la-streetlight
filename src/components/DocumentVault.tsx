import { useEffect, useMemo, useState } from "react";
import { Lock, Unlock, ShieldCheck, Download, ChevronRight, AlertTriangle, Check } from "lucide-react";
import { clearVault, decryptVault, encryptVault, vaultExists, verifyPin } from "@/lib/vaultCrypto";
import { awardLightPoints } from "@/hooks/useLightPoints";
import { toast } from "@/hooks/use-toast";
import { playVaultUnlockSound, playVaultLockSound } from "@/lib/feedbackSounds";

type FieldType = "text" | "select" | "date" | "textarea" | "tel";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  optional?: boolean;
  hint?: string;
}

interface SectionDef {
  id: string;
  title: string;
  warmNote?: string;
  fields: FieldDef[];
}

const SECTIONS: SectionDef[] = [
  {
    id: "id",
    title: "State ID or Driver's License",
    fields: [
      { key: "status", label: "Status", type: "select", options: ["I have it", "Lost", "Never had one", "In progress"] },
      { key: "id_number", label: "ID number", type: "text", optional: true },
      { key: "expiration", label: "Expiration date", type: "date", optional: true },
      { key: "kept", label: "Where is it kept?", type: "text", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  {
    id: "ssn",
    title: "Social Security Card",
    warmNote:
      "I'm not going to ask for your full Social Security Number — and neither should any app. Just track where your card is.",
    fields: [
      { key: "status", label: "Status", type: "select", options: ["I have it", "Lost", "Never had one", "Replacement requested"] },
      { key: "kept", label: "Where is it kept?", type: "text", optional: true, hint: "Not the SSN — just the location" },
      { key: "last4", label: "Last 4 digits only (optional)", type: "text", optional: true },
      { key: "notes", label: "Notes & next steps", type: "textarea", optional: true },
    ],
  },
  {
    id: "birth",
    title: "Birth Certificate",
    fields: [
      { key: "status", label: "Status", type: "select", options: ["I have it", "Lost", "Never had one", "Requested copy"] },
      { key: "kept", label: "Where is it kept?", type: "text", optional: true },
      { key: "state", label: "State born in", type: "text", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  {
    id: "health",
    title: "Health Insurance",
    fields: [
      { key: "status", label: "Status", type: "select", options: ["Active Medi-Cal", "Active Other", "Lapsed", "Never enrolled", "In process"] },
      { key: "member_id", label: "Member ID (optional)", type: "text", optional: true },
      { key: "plan", label: "Provider or plan name", type: "text", optional: true },
      { key: "card_kept", label: "Where is the card?", type: "text", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  {
    id: "bank",
    title: "Bank Account",
    fields: [
      { key: "status", label: "Status", type: "select", options: ["I have one", "Closed", "Never had one", "In process"] },
      { key: "bank", label: "Bank name", type: "text", optional: true },
      { key: "last4", label: "Last 4 digits of account (optional)", type: "text", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  {
    id: "housing",
    title: "Housing Documents",
    fields: [
      { key: "situation", label: "Current housing situation", type: "select", options: ["Stable housing", "Transitional housing", "Shelter", "Couch surfing", "Unhoused", "Other"] },
      { key: "program", label: "Program or address", type: "text", optional: true },
      { key: "case_manager", label: "Case manager name & contact", type: "text", optional: true },
      { key: "end_date", label: "Lease or program end date", type: "date", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  {
    id: "education",
    title: "Education and Training",
    fields: [
      { key: "status", label: "Status", type: "select", options: ["In high school", "GED in progress", "GED complete", "High school diploma", "In college", "In vocational program", "Not enrolled"] },
      { key: "school", label: "School or program name", type: "text", optional: true },
      { key: "student_id", label: "Student ID", type: "text", optional: true },
      { key: "counselor", label: "Counselor contact", type: "text", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  {
    id: "employment",
    title: "Employment",
    fields: [
      { key: "status", label: "Status", type: "select", options: ["Employed full-time", "Employed part-time", "Looking for work", "In job training", "Self-employed", "Not working"] },
      { key: "employer", label: "Employer name", type: "text", optional: true },
      { key: "supervisor", label: "Supervisor contact", type: "text", optional: true },
      { key: "pay_schedule", label: "Pay schedule", type: "text", optional: true },
      { key: "notes", label: "Notes", type: "textarea", optional: true },
    ],
  },
  {
    id: "emergency",
    title: "Emergency Contacts",
    fields: [
      { key: "c1_name", label: "Contact 1 — Name", type: "text", optional: true },
      { key: "c1_phone", label: "Contact 1 — Phone", type: "tel", optional: true },
      { key: "c1_rel", label: "Contact 1 — Relationship", type: "text", optional: true },
      { key: "c2_name", label: "Contact 2 — Name", type: "text", optional: true },
      { key: "c2_phone", label: "Contact 2 — Phone", type: "tel", optional: true },
      { key: "c2_rel", label: "Contact 2 — Relationship", type: "text", optional: true },
    ],
  },
];

type VaultData = Record<string, Record<string, string>>;

type Mode = "intro" | "setup" | "unlock" | "main" | "section";

const PIN_RX = /^\d{4,8}$/;

const DocumentVault = () => {
  const [mode, setMode] = useState<Mode>(() => (vaultExists() ? "unlock" : "intro"));
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [sessionPin, setSessionPin] = useState<string | null>(null);
  const [data, setData] = useState<VaultData>({});
  const [activeSection, setActiveSection] = useState<SectionDef | null>(null);

  // Auto-lock after 5min of background
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        setTimeout(() => {
          if (document.visibilityState === "hidden") lock();
        }, 5 * 60 * 1000);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filledCount = useMemo(
    () => SECTIONS.filter((s) => data[s.id] && Object.values(data[s.id]).some((v) => v && v.trim())).length,
    [data],
  );

  const lock = () => {
    playVaultLockSound();
    setSessionPin(null);
    setData({});
    setMode(vaultExists() ? "unlock" : "intro");
    setPin("");
    setPin2("");
    setError("");
    setActiveSection(null);
  };

  const handleSetup = async () => {
    setError("");
    if (!PIN_RX.test(pin)) return setError("PIN must be 4–8 digits.");
    if (pin !== pin2) return setError("PINs don't match.");
    await encryptVault(pin, {});
    playVaultUnlockSound();
    setSessionPin(pin);
    setData({});
    setMode("main");
    setPin("");
    setPin2("");
    const r = await awardLightPoints("vault_setup");
    if (r?.awarded) {
      toast({ title: "🎖️ Vault Builder badge earned", description: `+${r.awarded} Light Points` });
    } else {
      toast({ title: "Vault ready 🔒", description: "Your information is encrypted on this device." });
    }
  };

  const handleUnlock = async () => {
    setError("");
    if (!PIN_RX.test(pin)) return setError("PIN must be 4–8 digits.");
    const ok = await verifyPin(pin);
    if (!ok) return setError("That PIN didn't match. Try again.");
    const decrypted = (await decryptVault<VaultData>(pin)) || {};
    playVaultUnlockSound();
    setSessionPin(pin);
    setData(decrypted);
    setMode("main");
    setPin("");
  };

  const persist = async (next: VaultData) => {
    if (!sessionPin) return;
    setData(next);
    await encryptVault(sessionPin, next);
  };

  const exportVault = () => {
    const lines: string[] = [
      "LA Streetlight — Document Vault Export",
      `Exported: ${new Date().toLocaleString()}`,
      "",
    ];
    for (const s of SECTIONS) {
      lines.push(`== ${s.title} ==`);
      const sd = data[s.id] || {};
      const has = Object.values(sd).some((v) => v && v.trim());
      if (!has) {
        lines.push("(no info saved)");
      } else {
        for (const f of s.fields) {
          const v = sd[f.key];
          if (v && v.trim()) lines.push(`${f.label}: ${v}`);
        }
      }
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `streetlight-vault-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetVaultEntirely = () => {
    if (!confirm("Erase the vault on this device? This cannot be undone.")) return;
    clearVault();
    lock();
  };

  // ==== Renders ====

  if (mode === "intro") {
    return (
      <div className="px-4 pt-6 pb-24">
        <h2 className="font-display text-xl text-foreground mb-3">Document Vault</h2>
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 mb-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-base text-foreground mb-1">A safe place for your important info.</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Vault helps you remember where your ID, birth certificate, health card, and other documents
                are kept. It's protected by a PIN you choose, and locked on this device only.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-lg p-3">
            <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">
              <strong>I will never ask for your full Social Security Number.</strong> No app should.
              You can save the last 4 digits if you want — that's it.
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your PIN is the only key. If you forget it, the data can't be recovered — not by us, not by anyone.
            That's what keeps it private.
          </p>
        </div>
        <button
          onClick={() => setMode("setup")}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-display font-semibold"
        >
          Set up my Vault
        </button>
      </div>
    );
  }

  if (mode === "setup") {
    return (
      <div className="px-4 pt-6 pb-24">
        <h2 className="font-display text-xl text-foreground mb-2">Create your PIN</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Pick 4 to 8 digits you'll remember. Don't use your birthday.
        </p>
        <div className="space-y-3 mb-5">
          <input
            type="password"
            inputMode="numeric"
            pattern="\d*"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="New PIN"
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground tracking-widest text-center text-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            inputMode="numeric"
            pattern="\d*"
            maxLength={8}
            value={pin2}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
            placeholder="Confirm PIN"
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground tracking-widest text-center text-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          ⚠️ If you forget this PIN, the vault can't be unlocked. There's no reset.
        </p>
        <button
          onClick={handleSetup}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-display font-semibold"
        >
          Lock it in
        </button>
        <button
          onClick={() => setMode("intro")}
          className="w-full mt-2 text-sm text-muted-foreground py-2"
        >
          Back
        </button>
      </div>
    );
  }

  if (mode === "unlock") {
    return (
      <div className="px-4 pt-6 pb-24">
        <h2 className="font-display text-xl text-foreground mb-2 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" /> Vault locked
        </h2>
        <p className="text-sm text-muted-foreground mb-5">Enter your PIN to unlock.</p>
        <input
          type="password"
          inputMode="numeric"
          pattern="\d*"
          maxLength={8}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="PIN"
          className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground tracking-widest text-center text-lg focus:outline-none focus:ring-1 focus:ring-primary mb-3"
        />
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        <button
          onClick={handleUnlock}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-display font-semibold"
        >
          <Unlock className="w-4 h-4 inline mr-1" /> Unlock
        </button>
        <button
          onClick={resetVaultEntirely}
          className="w-full mt-4 text-xs text-destructive/80 py-2 underline"
        >
          Forgot PIN — erase vault and start over
        </button>
      </div>
    );
  }

  if (mode === "section" && activeSection) {
    const s = activeSection;
    const sd = data[s.id] || {};
    const setField = (k: string, v: string) =>
      setData((d) => ({ ...d, [s.id]: { ...(d[s.id] || {}), [k]: v } }));
    const save = async () => {
      await persist(data);
      toast({ title: "Saved", description: `${s.title} updated.` });
      setActiveSection(null);
      setMode("main");
    };
    return (
      <div className="px-4 pt-6 pb-24">
        <button
          onClick={() => {
            setActiveSection(null);
            setMode("main");
          }}
          className="text-sm text-muted-foreground mb-3"
        >
          ← Back to vault
        </button>
        <h2 className="font-display text-xl text-foreground mb-2">{s.title}</h2>
        {s.warmNote && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
            <p className="text-xs text-foreground leading-relaxed">{s.warmNote}</p>
          </div>
        )}
        <div className="space-y-3">
          {s.fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={sd[f.key] || ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select…</option>
                  {f.options?.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  value={sd[f.key] || ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  rows={3}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <input
                  type={f.type === "date" ? "date" : f.type === "tel" ? "tel" : "text"}
                  value={sd[f.key] || ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
              {f.hint && <p className="text-[11px] text-muted-foreground mt-1">{f.hint}</p>}
            </div>
          ))}
        </div>
        <button
          onClick={save}
          className="w-full mt-5 bg-primary text-primary-foreground rounded-xl py-3 font-display font-semibold"
        >
          Save
        </button>
      </div>
    );
  }

  // main
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-xl text-foreground">Document Vault</h2>
        <button
          onClick={lock}
          className="text-xs text-muted-foreground flex items-center gap-1 px-2 py-1 rounded border border-border"
        >
          <Lock className="w-3.5 h-3.5" /> Lock
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {filledCount} of {SECTIONS.length} sections filled
      </p>

      <div className="space-y-2 mb-5">
        {SECTIONS.map((s) => {
          const sd = data[s.id] || {};
          const filled = Object.values(sd).some((v) => v && v.trim());
          return (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(s);
                setMode("section");
              }}
              className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 active:bg-secondary transition-colors text-left"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  filled ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
                }`}
              >
                {filled ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <p className={`text-xs ${filled ? "text-accent" : "text-muted-foreground"}`}>
                  {filled ? "Info saved — tap to update" : "Tap to fill in"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      <button
        onClick={exportVault}
        className="w-full bg-secondary text-secondary-foreground rounded-xl py-3 font-medium flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" /> Export to text file
      </button>
    </div>
  );
};

export default DocumentVault;
