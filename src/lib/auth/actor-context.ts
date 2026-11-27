import { AsyncLocalStorage } from "node:async_hooks";
import type { CurrentUser } from "@/types";

export type ActorContext = {
  user: CurrentUser;
  privileged: boolean;
};

const storage = new AsyncLocalStorage<ActorContext>();

export function runWithActor<T>(context: ActorContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getActor(): ActorContext | null {
  return storage.getStore() ?? null;
}
