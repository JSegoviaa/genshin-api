import { createApp } from "./app";
import { D1ApiKeyStore } from "./core/api-keys";
import { TurnstileVerifier } from "./core/turnstile";
import type { Dataset } from "./core/store";
import data from "./generated/data.json";

export default createApp(data as unknown as Dataset, {
  apiKeys: (env) => {
    if (!env.DB) throw new Error("The DB binding is not configured");
    return new D1ApiKeyStore(env.DB);
  },
  humanVerifier: (env) => {
    if (!env.TURNSTILE_SECRET_KEY)
      throw new Error("The TURNSTILE_SECRET_KEY secret is not configured");
    return new TurnstileVerifier(env.TURNSTILE_SECRET_KEY);
  },
});
