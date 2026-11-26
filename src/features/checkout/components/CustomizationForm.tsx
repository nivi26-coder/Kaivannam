"use client";

// The product's configurator. It's a Client Component because the price and
// making time update as the buyer taps, which needs React state in the browser.
//
// The total shown here is only a preview. On submit the browser sends the
// buyer's *choices*, never a price; the placeOrder service loads the product
// from the database and runs the same quoteItem() to get the real total.

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { CalendarDays, ImageIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateBuyerDetails } from "@/domain/buyer";
import { DEFAULT_TRANSIT_DAYS, estimateDelivery } from "@/domain/delivery";
import type { FieldErrors } from "@/domain/errors";
import type { Paise } from "@/domain/money";
import { quoteItem } from "@/domain/pricing";
import {
  getInitialSelections,
  isGroupRequired,
  validateSelections,
  type MultiChoiceGroup,
  type OptionChoice,
  type OptionGroup,
  type Selections,
  type SingleChoiceGroup,
} from "@/domain/product-options";
import { formatDate } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { placeOrderAction, type PlaceOrderState } from "../actions";

type Props = {
  productId: string;
  basePricePaise: Paise;
  baseProductionDays: number;
  optionGroups: OptionGroup[];
  maxRevisions: number;
  isAcceptingOrders: boolean;
  /** Today in India ("YYYY-MM-DD"), from the server at request time. */
  today: string;
};

const initialState: PlaceOrderState = {};

function omit(errors: FieldErrors, key: string): FieldErrors {
  const next = { ...errors };
  delete next[key];
  return next;
}

function signedPrice(amount: Paise) {
  return amount > 0 ? `+${formatINR(amount)}` : `−${formatINR(Math.abs(amount))}`;
}

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

/** "+₹600 · +1 day" for an option that changes price or time. */
function optionImpact(option: OptionChoice): string {
  return [
    option.pricePaise !== 0 ? signedPrice(option.pricePaise) : null,
    option.extraDays > 0 ? `+${days(option.extraDays)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Messages, quotes and notes get a multi-line box; other text stays one line. */
function isLongText(group: OptionGroup) {
  return group.type === "text" && group.maxLength > 60;
}

export function CustomizationForm({
  productId,
  basePricePaise,
  baseProductionDays,
  optionGroups,
  maxRevisions,
  isAcceptingOrders,
  today,
}: Props) {
  const [state, formAction, isPending] = useActionState(placeOrderAction, initialState);

  // Every input is controlled: the live total reads from this state, and a
  // failed submit keeps everything the buyer typed.
  const [selections, setSelections] = useState<Selections>(() => getInitialSelections(optionGroups));
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  // Errors found in the browser take priority; otherwise show the server's.
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const errors = clientErrors ?? state.errors ?? {};

  const formRef = useRef<HTMLFormElement>(null);
  const quote = quoteItem({ basePricePaise, baseProductionDays, optionGroups }, selections);
  const estimate = estimateDelivery({ productionDays: quote.productionDays, today });

  function clearError(key: string) {
    if (errors[key]) setClientErrors(omit(errors, key));
  }

  function setSelection(key: string, value: string | string[]) {
    setSelections((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // We submit manually (instead of <form action>) so we can check the form
    // first, and so React doesn't reset the fields after a failed attempt.
    event.preventDefault();

    // The same domain checks the server runs, for instant feedback.
    const found = validateSelections(optionGroups, selections);
    Object.assign(found, validateBuyerDetails({ buyerName, buyerPhone }).errors);

    if (Object.keys(found).length > 0) {
      setClientErrors(found);
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      });
      return;
    }

    setClientErrors(null);
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
      <input type="hidden" name="productId" value={productId} />

      <fieldset disabled={!isAcceptingOrders || isPending} className="space-y-6">
        <section className="space-y-5">
          <h2 className="font-heading text-lg font-semibold">Make it yours</h2>
          {optionGroups.map((group) => (
            <OptionGroupInput
              key={group.key}
              group={group}
              value={selections[group.key] ?? (group.type === "multi" ? [] : "")}
              error={errors[group.key]}
              onChange={(value) => setSelection(group.key, value)}
            />
          ))}
        </section>

        <section className="space-y-5">
          <h2 className="font-heading text-lg font-semibold">Your details</h2>
          <TextRow
            id="buyerName"
            label="Your name"
            error={errors.buyerName}
            input={
              <Input
                id="buyerName"
                name="buyerName"
                autoComplete="name"
                value={buyerName}
                maxLength={80}
                onChange={(e) => {
                  setBuyerName(e.target.value);
                  clearError("buyerName");
                }}
                aria-invalid={Boolean(errors.buyerName)}
                aria-describedby={errors.buyerName ? "buyerName-error" : undefined}
                className="h-11 text-base"
              />
            }
          />
          <TextRow
            id="buyerPhone"
            label="Mobile number"
            hint="The artist will message you on WhatsApp about your order."
            error={errors.buyerPhone}
            input={
              <Input
                id="buyerPhone"
                name="buyerPhone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98400 12345"
                value={buyerPhone}
                onChange={(e) => {
                  setBuyerPhone(e.target.value);
                  clearError("buyerPhone");
                }}
                aria-invalid={Boolean(errors.buyerPhone)}
                aria-describedby={errors.buyerPhone ? "buyerPhone-error" : "buyerPhone-hint"}
                className="h-11 text-base"
              />
            }
          />
        </section>
      </fieldset>

      <section aria-labelledby="price-heading" className="space-y-3 rounded-xl border bg-card p-4">
        <h2 id="price-heading" className="font-heading text-lg font-semibold">
          Price and timing
        </h2>
        <dl className="space-y-1.5 text-sm">
          {quote.lines.map((line) => (
            <div key={line.label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {line.label}
                {line.extraDays > 0 && <span className="text-xs"> (+{days(line.extraDays)})</span>}
              </dt>
              <dd className="tabular-nums">
                {line.label === "Base price" ? formatINR(line.amountPaise) : line.amountPaise === 0 ? "—" : signedPrice(line.amountPaise)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="flex gap-1.5 border-t pt-3 text-sm">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            Ready to ship in {days(quote.productionDays)}. Arrives around{" "}
            <strong>{formatDate(estimate.deliverBy)}</strong>
            <span className="text-xs text-muted-foreground"> (allowing {DEFAULT_TRANSIT_DAYS} days for the courier)</span>
          </span>
        </p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li className="flex gap-1.5">
            <ShieldCheck className="size-4 shrink-0 text-emerald-700" aria-hidden />
            Your money is held by Kaivannam and released to the artist only after delivery.
          </li>
          <li className="pl-5.5">
            You&apos;ll approve a preview first, with {maxRevisions} free{" "}
            {maxRevisions === 1 ? "revision" : "revisions"}.
          </li>
        </ul>
      </section>

      {state.message && !clientErrors && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}

      {/* Sticky on phones so the live total is always in view while customising. */}
      <div className="sticky bottom-0 z-30 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold tabular-nums" aria-live="polite">
              {formatINR(quote.itemTotalPaise)}
            </p>
          </div>
          <Button
            type="submit"
            disabled={!isAcceptingOrders || isPending}
            className="h-11 px-6 text-base"
          >
            {!isAcceptingOrders ? "Orders paused" : isPending ? "Placing order…" : "Place order"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ------------------------------------------------------------------ fields

function TextRow({
  id,
  label,
  hint,
  error,
  input,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {input}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const CHIP =
  "cursor-pointer rounded-full border bg-card px-3.5 py-2 text-sm transition-colors has-checked:border-primary has-checked:bg-primary/10 has-checked:text-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50";

function OptionGroupInput({
  group,
  value,
  error,
  onChange,
}: {
  group: OptionGroup;
  value: string | string[];
  error?: string;
  onChange: (value: string | string[]) => void;
}) {
  const id = `option-${group.key}`;
  // Every answer is submitted as "option:<key>"; checkboxes repeat the name.
  const name = `option:${group.key}`;
  const label = isGroupRequired(group) ? group.label : `${group.label} (optional)`;
  const errorProps = {
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
  };
  const text = typeof value === "string" ? value : "";

  if (group.type === "single" && group.options.length <= 4) {
    return <ChoiceChips group={group} id={id} name={name} label={label} selected={[text]} error={error} onSelect={(v) => onChange(v)} />;
  }

  if (group.type === "multi") {
    const picked = Array.isArray(value) ? value : [];
    return (
      <ChoiceChips
        group={group}
        id={id}
        name={name}
        label={group.max < group.options.length ? `${label} · up to ${group.max}` : label}
        selected={picked}
        error={error}
        onSelect={(v) => onChange(picked.includes(v) ? picked.filter((p) => p !== v) : [...picked, v])}
      />
    );
  }

  if (group.type === "single") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <select
          id={id}
          name={name}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          {...errorProps}
        >
          {!group.required && <option value="">None</option>}
          {group.options.map((option) => {
            const impact = optionImpact(option);
            return (
              <option key={option.value} value={option.value}>
                {option.label}
                {impact ? ` (${impact})` : ""}
              </option>
            );
          })}
        </select>
        <FieldError id={id} error={error} />
      </div>
    );
  }

  if (group.type === "photo") {
    return <PhotoField id={id} name={name} label={label} value={text} error={error} onChange={onChange} />;
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {isLongText(group) ? (
        <Textarea
          id={id}
          name={name}
          rows={3}
          maxLength={group.maxLength}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className="text-base"
          {...errorProps}
        />
      ) : (
        <Input
          id={id}
          name={name}
          maxLength={group.maxLength}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 text-base"
          {...errorProps}
        />
      )}
      <FieldError id={id} error={error} />
    </div>
  );
}

/** Tappable chips showing each option's price and time impact: radios for single choice, checkboxes for add-ons. */
function ChoiceChips({
  group,
  id,
  name,
  label,
  selected,
  error,
  onSelect,
}: {
  group: SingleChoiceGroup | MultiChoiceGroup;
  id: string;
  name: string;
  label: string;
  selected: string[];
  error?: string;
  onSelect: (value: string) => void;
}) {
  const isMulti = group.type === "multi";
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {group.options.map((option, index) => {
          const impact = optionImpact(option);
          return (
            <label key={option.value} className={CHIP}>
              <input
                type={isMulti ? "checkbox" : "radio"}
                name={name}
                value={option.value}
                checked={selected.includes(option.value)}
                onChange={() => onSelect(option.value)}
                className="sr-only"
                aria-invalid={index === 0 ? Boolean(error) : undefined}
                aria-describedby={index === 0 && error ? `${id}-error` : undefined}
              />
              {option.label}
              {impact && <span className="ml-1.5 text-xs opacity-75">{impact}</span>}
            </label>
          );
        })}
      </div>
      <FieldError id={id} error={error} />
    </fieldset>
  );
}

/**
 * Demo version of a photo upload. The chosen photo is previewed locally but
 * never leaves the phone; only its file name is submitted. Real uploads
 * (Supabase Storage) come in T1.9.
 */
function PhotoField({
  id,
  name,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Free the local preview's memory when it's replaced or the form unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {/* The file input has no `name`, so the photo itself is never sent. */}
      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPreviewUrl(URL.createObjectURL(file));
          onChange(file.name);
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
      />
      <input type="hidden" name={name} value={value} />
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-card p-3 transition-colors hover:bg-muted",
          error && "border-destructive",
        )}
      >
        {previewUrl ? (
          // A local blob: URL, which next/image can't optimise, so a plain <img> is right here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="size-14 rounded-lg object-cover" />
        ) : (
          <span className="grid size-14 place-items-center rounded-lg bg-muted">
            <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
          </span>
        )}
        <span className="min-w-0 text-sm">
          <span className="block truncate font-medium">{value || "Choose a photo"}</span>
          <span className="text-xs text-muted-foreground">
            {value ? "Tap to change" : "From your gallery or camera"}
          </span>
        </span>
      </label>
      {error ? (
        <FieldError id={id} error={error} />
      ) : (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          Demo: your photo stays on your phone. Only its file name is sent.
        </p>
      )}
    </div>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="text-sm text-destructive">
      {error}
    </p>
  );
}
