import { useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function DashboardWalkthrough({ auditId, paid }: { auditId?: number; paid: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const focusWebsite = useRef(false);
  const steps = [
    { title: "Start with one website", body: "Enter your website below and run your first audit. You do not need to connect Google or install a tracking snippet to get your first recommendations.", href: auditId ? `/results/${auditId}` : "#baseline-url", action: auditId ? "Review my audit" : "Enter my website" },
    { title: "Choose one practical improvement", body: "Open Action plan in the navigation. Start with one recommendation, read the evidence and instructions, and make the change on your website. Mark it complete only after you have implemented it.", href: auditId ? `/actions/${auditId}` : undefined, action: "Open my action plan" },
    { title: "Test a question your buyer would ask", body: "Open Prompt test, check that the suggested questions fit your brand, then run a simulation within your plan allowance. This is a sample of AI responses, not a guarantee of visibility everywhere.", href: auditId ? `/simulate/${auditId}` : undefined, action: "Try a prompt test" },
    { title: "Measure progress when you are ready", body: paid ? "Use Tracking to connect Google. Choose keywords in SEO opportunities, then revisit your results each week. Ranking and traffic changes are observations, not proof that one fix caused them." : "Your audit and action plan come first. Pro and Agency add connected Google data and keyword tracking. You can explore your recommendations before deciding to upgrade.", href: paid ? "/projects" : "/upgrade?source=dashboard-walkthrough", action: paid ? "Set up measurement" : "Compare tracking plans" },
  ];
  const current = steps[step];
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4" aria-label="Dashboard help">
      <div><h2 className="font-semibold">Not sure where to start?</h2><p className="text-sm text-muted-foreground">One audit, one useful fix, then measure your progress.</p></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button variant="outline" onClick={() => setStep(0)}>Show me around</Button></DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg" onCloseAutoFocus={(event) => {
          if (focusWebsite.current) {
            event.preventDefault();
            focusWebsite.current = false;
            document.getElementById("baseline-url")?.focus();
          }
        }}>
          <DialogHeader><p className="text-sm text-muted-foreground" aria-live="polite">Step {step + 1} of {steps.length}</p><DialogTitle>{current.title}</DialogTitle><DialogDescription className="pt-2 leading-relaxed">{current.body}</DialogDescription></DialogHeader>
          {current.href === "#baseline-url" ? <Button className="w-full" onClick={() => { focusWebsite.current = true; setOpen(false); }}>{current.action}</Button> : current.href ? <Link href={current.href} onClick={() => setOpen(false)}><Button className="w-full">{current.action}</Button></Link> : <p className="text-sm text-muted-foreground">Run your first audit to unlock this step.</p>}
          <div className="flex justify-between gap-2"><Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button><Button variant="outline" onClick={() => step < steps.length - 1 ? setStep(step + 1) : setOpen(false)}>{step < steps.length - 1 ? "Next" : "Done"}</Button></div>
          <p className="text-xs text-muted-foreground">Close this guide anytime. Show me around will always be here.</p>
        </DialogContent>
      </Dialog>
    </section>
  );
}
