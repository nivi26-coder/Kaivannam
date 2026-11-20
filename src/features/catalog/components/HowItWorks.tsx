import { MessageSquare, Palette, ShieldCheck, type LucideIcon } from "lucide-react";

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Palette,
    title: "Customise",
    body: "Pick options, add names and photos, and see the exact price instantly.",
  },
  {
    icon: MessageSquare,
    title: "Approve a preview",
    body: "The artist sends a mockup first. Ask for changes until it's right.",
  },
  {
    icon: ShieldCheck,
    title: "Pay safely",
    body: "Kaivannam holds your payment and releases it to the artist only after delivery.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-14">
      <h2 className="font-heading text-2xl font-semibold">Why order here, not on Instagram?</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, index) => (
          <li key={title} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
            </div>
            <h3 className="mt-3 font-medium">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
