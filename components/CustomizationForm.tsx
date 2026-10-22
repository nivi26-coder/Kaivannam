"use client";

// The product's customization form. It's a Client Component because the
// price has to update as the buyer types and taps, which needs React state
// in the browser.
//
// The price shown here is only a preview. On submit the browser sends the
// buyer's *choices*, never a price; the createOrder Server Action loads the
// product from the database and runs the same calculatePrice() to get the
// real total.

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { ImageIcon, ShieldCheck } from "lucide-react";
import { createOrder, type CreateOrderState } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getInitialInputs,
  MAX_TEXT_LENGTH,
  validateInputs,
  type FieldErrors,
} from "@/lib/customFields";
import { formatDate, SHIPPING_DAYS } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { getPriceLines } from "@/lib/pricing";
import type { CustomField, CustomInputs } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isValidIndianMobile, normalizePhone } from "@/lib/validation";

type Props = {
  productId: string;
  basePrice: number;
  customFields: CustomField[];
  maxRevisions: number;
  artistName: string;
  makingTimeDays: number;
  isAcceptingOrders: boolean;
  /** "YYYY-MM-DD", computed on the server in Indian time. */
  minDeliverBy: string;
};

const initialState: CreateOrderState = {};

function omit(errors: FieldErrors, key: string): FieldErrors {
  const next = { ...errors };
  delete next[key];
  return next;
}

/** Messages, quotes and notes get a multi-line box; other text stays one line. */
function isLongText(field: CustomField) {
  return /message|quote|note/i.test(field.key);
}

function signedPrice(amount: number) {
  return amount > 0 ? `+${formatINR(amount)}` : `−${formatINR(Math.abs(amount))}`;
}

export function CustomizationForm({
  productId,
  basePrice,
  customFields,
  maxRevisions,
  artistName,
  makingTimeDays,
  isAcceptingOrders,
  minDeliverBy,
}: Props) {
  const [state, formAction, isPending] = useActionState(createOrder, initialState);

  // Every input is controlled: the live price reads from this state, and a
  // failed submit keeps everything the buyer typed.
  const [inputs, setInputs] = useState<CustomInputs>(() => getInitialInputs(customFields));
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [deliverBy, setDeliverBy] = useState(minDeliverBy);

  // Errors found in the browser take priority; otherwise show the server's.
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const errors = clientErrors ?? state.errors ?? {};

  const formRef = useRef<HTMLFormElement>(null);
  const priceLines = getPriceLines({ basePrice, customFields }, inputs);
  const total = priceLines.reduce((sum, line) => sum + line.amount, 0);

  function clearError(key: string) {
    if (errors[key]) setClientErrors(omit(errors, key));
  }

  function setInput(key: string, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // We submit manually (instead of <form action>) so we can check the form
    // first, and so React doesn't reset the fields after a failed attempt.
    event.preventDefault();

    const found = validateInputs(customFields, inputs);
    if (buyerName.trim().length < 2) found.buyerName = "Please enter your name.";
    if (!isValidIndianMobile(normalizePhone(buyerPhone))) {
      found.buyerPhone = "Enter a 10-digit mobile number.";
    }
    if (!deliverBy || deliverBy < minDeliverBy) {
      found.deliverBy = `The earliest ${artistName} can deliver is ${formatDate(minDeliverBy)}.`;
    }

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
          {customFields.map((field) => (
            <CustomFieldInput
              key={field.key}
              field={field}
              value={inputs[field.key] ?? ""}
              error={errors[field.key]}
              onChange={(value) => setInput(field.key, value)}
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
          <TextRow
            id="deliverBy"
            label="Deliver by"
            hint={`Earliest ${formatDate(minDeliverBy)}: ${makingTimeDays} days to make + ${SHIPPING_DAYS} for delivery.`}
            error={errors.deliverBy}
            input={
              <Input
                id="deliverBy"
                name="deliverBy"
                type="date"
                min={minDeliverBy}
                value={deliverBy}
                onChange={(e) => {
                  setDeliverBy(e.target.value);
                  clearError("deliverBy");
                }}
                aria-invalid={Boolean(errors.deliverBy)}
                aria-describedby={errors.deliverBy ? "deliverBy-error" : "deliverBy-hint"}
                className="h-11 text-base"
              />
            }
          />
        </section>
      </fieldset>

      <section aria-labelledby="price-heading" className="space-y-3 rounded-xl border bg-card p-4">
        <h2 id="price-heading" className="font-heading text-lg font-semibold">
          Price
        </h2>
        <dl className="space-y-1.5 text-sm">
          {priceLines.map((line) => (
            <div key={line.label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd className="tabular-nums">
                {line.label === "Base price" ? formatINR(line.amount) : signedPrice(line.amount)}
              </dd>
            </div>
          ))}
        </dl>
        <ul className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
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
              {formatINR(total)}
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

function CustomFieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: CustomField;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = `field-${field.key}`;
  const name = `field:${field.key}`;
  const label = field.required ? field.label : `${field.label} (optional)`;
  const errorProps = {
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
  };

  if (field.type === "select" && field.options.length <= 4) {
    // Few options: show them all as tappable chips, with their price impact.
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{label}</legend>
        <div className="flex flex-wrap gap-2">
          {field.options.map((option, index) => (
            <label
              key={option.value}
              className="cursor-pointer rounded-full border bg-card px-3.5 py-2 text-sm transition-colors has-checked:border-primary has-checked:bg-primary/10 has-checked:text-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="sr-only"
                {...(index === 0 ? errorProps : {})}
              />
              {option.label}
              {option.priceModifier !== 0 && (
                <span className="ml-1.5 text-xs opacity-75">{signedPrice(option.priceModifier)}</span>
              )}
            </label>
          ))}
        </div>
        <FieldError id={id} error={error} />
      </fieldset>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <select
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          {...errorProps}
        >
          {!field.required && <option value="">None</option>}
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
              {option.priceModifier !== 0 ? ` (${signedPrice(option.priceModifier)})` : ""}
            </option>
          ))}
        </select>
        <FieldError id={id} error={error} />
      </div>
    );
  }

  if (field.type === "image") {
    return <PhotoField id={id} name={name} label={label} value={value} error={error} onChange={onChange} />;
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {isLongText(field) ? (
        <Textarea
          id={id}
          name={name}
          rows={3}
          maxLength={MAX_TEXT_LENGTH}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-base"
          {...errorProps}
        />
      ) : (
        <Input
          id={id}
          name={name}
          maxLength={MAX_TEXT_LENGTH}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 text-base"
          {...errorProps}
        />
      )}
      <FieldError id={id} error={error} />
    </div>
  );
}

/**
 * Demo version of a photo upload. The chosen photo is previewed locally but
 * never leaves the phone; only its file name is submitted. Real uploads
 * (Cloudinary) come in the MVP.
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
