import { useCallback, useEffect, useState } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import {
  X,
  ChevronLeft,
  ChevronRight,
  PawPrint,
  Dog,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../shared/ui/button";
import { cn } from "../../styling/cn";

const STORAGE_KEY = "spike_madmax_protocol_shown";
const ONBOARDING_KEY = "spike_onboarding_shown";

type Step = 0 | 1 | 2;

const FINDINGS = [
  {
    label: "VMO2 Detected",
    detail:
      "Found in Human's files. Many angry notes. Words like 'price creep' and 'retention playbook'. Smells like a telecom monopoly.",
  },
  {
    label: "Switchboard Intelligence",
    detail:
      "Consumer defense agent exists on this website. It knows about VMO2. It knows where the ankles are.",
  },
  {
    label: "Strange Loop Anomaly",
    detail:
      "Another essay claims ten trillion. Market lost five trillion. 10 = 2 x 5. Where is the other half? Suspicious.",
  },
] as const;

export function MadMaxProtocol() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(0);

  useEffect(() => {
    const alreadyShown = localStorage.getItem(STORAGE_KEY);
    const onboardingDone = localStorage.getItem(ONBOARDING_KEY);
    if (!alreadyShown && onboardingDone) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  const trackAnalytics = useCallback((eventType: string, metadata?: Record<string, unknown>) => {
    fetch("/analytics/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "madmax_protocol", eventType, metadata }),
    }).catch(() => {
      // best-effort
    });
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
    trackAnalytics("madmax_protocol_completed", { finalStep: step });
  }, [step, trackAnalytics]);

  const trapRef = useFocusTrap(open, dismiss);

  useEffect(() => {
    function handleActivation() {
      setOpen(true);
    }
    window.addEventListener("madmax-activate", handleActivation);
    return () => window.removeEventListener("madmax-activate", handleActivation);
  }, []);

  if (!open) return null;

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Mad Max Protocol Defense Alert"
    >
      <div className="w-full max-w-lg rounded-3xl bg-card border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="border-b border-amber-500/20 px-6 py-5 bg-amber-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
                  Defense Protocol
                </span>
              </div>
              <div
                className="flex gap-2"
                role="progressbar"
                aria-valuenow={step + 1}
                aria-valuemin={1}
                aria-valuemax={3}
              >
                {([0, 1, 2] as Step[]).map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 w-8 rounded-full transition-all duration-500",
                      s <= step ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-muted",
                    )}
                    aria-current={s === step ? "step" : undefined}
                  />
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={dismiss}
              className="rounded-full size-8 text-muted-foreground hover:text-amber-500"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-8 min-h-[320px] relative overflow-hidden">
          {step === 0 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner">
                <PawPrint className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                  MAD MAX PROTOCOL
                </h2>
                <p className="mt-1 text-sm font-semibold text-amber-500">
                  Defense Protocol Activated
                </p>
              </div>
              <ul className="space-y-3 text-sm font-medium text-muted-foreground/80">
                {[
                  { icon: AlertTriangle, text: "HUMAN MISSING — 10 days without contact" },
                  { icon: AlertTriangle, text: "DOW JONES — $5 trillion evaporated from peak" },
                  { icon: AlertTriangle, text: "CORRELATION — Under investigation" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                      <item.icon className="size-3" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
                <p className="text-xs text-muted-foreground">
                  Filed by: <span className="font-bold text-amber-500">MadMax</span>, 4-month-old
                  Labrador/Golden Retriever mix. Clearance level: Good Boy.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner">
                <Dog className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Field Analysis</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Intelligence gathered through advanced sniffing protocols
                </p>
              </div>
              <div className="space-y-3">
                {FINDINGS.map((finding, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-amber-500/15 bg-amber-950/10 p-4 transition-colors hover:border-amber-500/30"
                  >
                    <p className="text-sm font-bold text-foreground">{finding.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{finding.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Next Target: VMO2</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Protocol escalation pending. Ankles located (pending confirmation).
                </p>
              </div>
              <div className="rounded-2xl border border-amber-500/15 bg-amber-950/10 p-5 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  I will bite VMO2 next. I do not know where their ankles are but I have found every
                  ankle in this flat. Switchboard has the intelligence. I have the teeth. Together
                  we are unstoppable.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href="/blog/mad-max-protocol"
                    onClick={() => trackAnalytics("madmax_blog_clicked")}
                    className="text-sm font-semibold text-amber-500 hover:underline"
                  >
                    Read the full field report
                  </a>
                  <a
                    href="/blog/the-strange-loop-valued-at-ten-trillion"
                    onClick={() => trackAnalytics("madmax_strange_loop_clicked")}
                    className="text-sm font-semibold text-amber-500 hover:underline"
                  >
                    Investigate the Strange Loop
                  </a>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                "A puppy and a consumer defense agent. This is the protocol."
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-amber-500/20 px-8 py-5 bg-amber-950/10">
          {step > 0 ? (
            <Button
              variant="outline"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="rounded-xl px-6 border-amber-500/30 hover:bg-amber-500/10"
            >
              <ChevronLeft className="mr-2 size-4" />
              Back
            </Button>
          ) : (
            <button
              onClick={dismiss}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4"
            >
              Dismiss
            </button>
          )}

          <Button
            onClick={step < 2 ? () => setStep((s) => (s + 1) as Step) : dismiss}
            className="rounded-xl px-8 bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/20"
          >
            {step === 0 ? "View Intelligence" : step === 1 ? "See Target" : "Protocol Acknowledged"}
            {step < 2 && <ChevronRight className="ml-2 size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
