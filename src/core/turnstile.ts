export interface HumanVerifier {
  verify(token: string, ip: string | null): Promise<boolean>;
}

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export class TurnstileVerifier implements HumanVerifier {
  readonly #secret: string;

  constructor(secret: string) {
    this.#secret = secret;
  }

  async verify(token: string, ip: string | null) {
    const form = new FormData();
    form.append("secret", this.#secret);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    if (!res.ok) throw new Error(`Turnstile siteverify failed: ${res.status}`);
    const outcome = (await res.json()) as { success?: boolean };
    return outcome.success === true;
  }
}
