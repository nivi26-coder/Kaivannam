"use client";

import { useActionState, useState } from "react";
import { requestChanges, type RequestChangesState } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: RequestChangesState = {};

export function RequestChangesForm({
  orderId,
  revisionsLeft,
}: {
  orderId: string;
  revisionsLeft: number;
}) {
  // bind() pre-fills the orderId argument; the form supplies the rest.
  const [state, formAction, isPending] = useActionState(
    requestChanges.bind(null, orderId),
    initialState,
  );
  const [open, setOpen] = useState(false);

  if (revisionsLeft <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You&apos;ve used all the free revisions for this gift. If something is still wrong, contact
        the artist before approving.
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" className="h-11 w-full" onClick={() => setOpen(true)}>
        Request changes ({revisionsLeft} {revisionsLeft === 1 ? "revision" : "revisions"} left)
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <Label htmlFor="comment">What should the artist change?</Label>
      <Textarea
        id="comment"
        name="comment"
        rows={3}
        maxLength={500}
        required
        placeholder="e.g. Please make the name a little bigger and use gold instead of silver."
        className="text-base"
        aria-invalid={Boolean(state.error)}
        aria-describedby={state.error ? "comment-error" : undefined}
      />
      {state.error && (
        <p id="comment-error" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending} className="h-11 flex-1">
          {isPending ? "Sending…" : "Send to artist"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          onClick={() => setOpen(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
