// Access to the Worker env without a static "cloudflare:workers" import:
// this module is also part of the client bundle, where vite's import
// analysis would fail to resolve the builtin (even inside dead branches
// during dev). The indirection + @vite-ignore defers resolution to the
// workerd runtime, which provides the module natively; callers must only
// invoke this server-side.
export interface WorkerEnv {
  /** Service binding to the runeprofile-api worker. */
  API: { fetch: (request: Request) => Promise<Response> };
}

export async function getWorkerEnv(): Promise<WorkerEnv> {
  const specifier = "cloudflare:workers";
  const mod = await import(/* @vite-ignore */ specifier);
  return mod.env as WorkerEnv;
}
