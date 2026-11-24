"use client";

import { useActionState } from "react";
import {
  deleteDemoAction,
  regenerateDemoAction,
  updateDemoPaletteAction,
  updateDemoTemplateAction,
  type DemoActionState,
} from "@/app/(app)/dashboard/demos/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DEMO_TEMPLATES, type DemoWebsiteRecord } from "@/services/demos/types";

export function DemoControls({ demo }: { demo: DemoWebsiteRecord }) {
  const [state, regenerate, pending] = useActionState<DemoActionState, FormData>(regenerateDemoAction, null);
  const palette = demo.palette;

  return (
    <div className="space-y-6">
      <form action={regenerate} className="space-y-2">
        <input type="hidden" name="demoId" value={demo.demo_id} />
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state?.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Regenerating…" : "Regenerate from research"}
        </Button>
        <p className="text-xs text-muted-foreground">Uses a website generation credit. Copy stays limited to verified facts.</p>
      </form>

      <form action={updateDemoTemplateAction} className="space-y-2">
        <input type="hidden" name="demoId" value={demo.demo_id} />
        <Label htmlFor="templateKey">Industry template</Label>
        <select
          id="templateKey"
          name="templateKey"
          defaultValue={demo.template_key}
          className="h-11 w-full rounded-xl border bg-card px-3 text-sm"
        >
          {DEMO_TEMPLATES.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
          {DEMO_TEMPLATES.some((item) => item.key === demo.template_key) ? null : (
            <option value={demo.template_key}>{demo.template_key}</option>
          )}
        </select>
        <Button type="submit" variant="outline">
          Apply template
        </Button>
      </form>

      <form action={updateDemoPaletteAction} className="space-y-3">
        <input type="hidden" name="demoId" value={demo.demo_id} />
        <p className="text-sm font-medium">Colours</p>
        {(
          [
            ["primary", palette.primary],
            ["secondary", palette.secondary],
            ["accent", palette.accent],
            ["background", palette.background],
            ["text", palette.text],
          ] as const
        ).map(([name, value]) => (
          <div key={name} className="flex items-center justify-between gap-3">
            <Label htmlFor={name} className="capitalize">
              {name}
            </Label>
            <input id={name} name={name} type="color" defaultValue={value} className="h-9 w-14 cursor-pointer rounded border" />
          </div>
        ))}
        <Button type="submit" variant="outline">
          Save colours
        </Button>
      </form>

      <CopyLink path={demo.preview_path} />

      <form action={deleteDemoAction}>
        <input type="hidden" name="demoId" value={demo.demo_id} />
        <Button type="submit" variant="destructive">
          Delete demo
        </Button>
      </form>
    </div>
  );
}

function CopyLink({ path }: { path: string }) {
  return (
    <div className="space-y-2">
      <Label>Public preview</Label>
      <p className="break-all rounded-xl border bg-muted/40 px-3 py-2 text-xs">{path}</p>
      <Button
        type="button"
        variant="outline"
        onClick={async () => {
          await navigator.clipboard.writeText(`${window.location.origin}${path}`);
        }}
      >
        Copy preview URL
      </Button>
      <p className="text-xs text-muted-foreground">
        Custom subdomains are not enabled. Recipients use this path. The preview always shows an unofficial disclaimer.
      </p>
    </div>
  );
}
