export function ExpiredNotice({ name }: { name: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md rounded-2xl border bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Unofficial preview expired</p>
        <h1 className="mt-3 text-2xl font-bold">{name}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This ProspectAI demonstration is no longer available. It was never the business’s official website.
        </p>
      </div>
    </div>
  );
}
