"use client";

import { useActionState } from "react";
import { authorizeConnectorAction, type AuthorizeState } from "@/app/oauth/authorize/actions";
import { Button } from "@/components/ui/button";

export function AuthorizeForm(props: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  email: string;
}) {
  const [state, action, pending] = useActionState<AuthorizeState, FormData>(authorizeConnectorAction, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="client_id" value={props.clientId} />
      <input type="hidden" name="redirect_uri" value={props.redirectUri} />
      <input type="hidden" name="state" value={props.state} />
      <input type="hidden" name="code_challenge" value={props.codeChallenge} />
      <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm">
        Signed in as <span className="font-medium">{props.email}</span>
      </p>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Allowing…" : "Allow access"}
      </Button>
    </form>
  );
}
