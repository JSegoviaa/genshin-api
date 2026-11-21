export const API_KEY_HEADER = "X-API-Key";

const KEY_PREFIX = "gsk_";
const SECRET_BYTES = 32;
const KEY_PATTERN = /^gsk_[A-Za-z0-9_-]{43}$/;

export interface NewApiKey {
  hash: string;
  prefix: string;
  name: string | null;
  createdAt: string;
}

export interface ApiKeyStore {
  create(key: NewApiKey): Promise<void>;
  isActive(hash: string): Promise<boolean>;
  revoke(hash: string, revokedAt: string): Promise<boolean>;
}

function base64url(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateApiKey() {
  const secret = base64url(crypto.getRandomValues(new Uint8Array(SECRET_BYTES)));
  return {
    key: `${KEY_PREFIX}${secret}`,
    prefix: `${KEY_PREFIX}${secret.slice(0, 8)}`,
  };
}

export const isWellFormedApiKey = (key: string) => KEY_PATTERN.test(key);

export async function hashApiKey(key: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(key),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class D1ApiKeyStore implements ApiKeyStore {
  readonly #db: D1Database;

  constructor(db: D1Database) {
    this.#db = db;
  }

  async create(key: NewApiKey) {
    await this.#db
      .prepare(
        "INSERT INTO api_keys (hash, prefix, name, created_at) VALUES (?, ?, ?, ?)",
      )
      .bind(key.hash, key.prefix, key.name, key.createdAt)
      .run();
  }

  async isActive(hash: string) {
    const row = await this.#db
      .prepare("SELECT 1 FROM api_keys WHERE hash = ? AND revoked_at IS NULL")
      .bind(hash)
      .first();
    return row !== null;
  }

  async revoke(hash: string, revokedAt: string) {
    const result = await this.#db
      .prepare(
        "UPDATE api_keys SET revoked_at = ? WHERE hash = ? AND revoked_at IS NULL",
      )
      .bind(revokedAt, hash)
      .run();
    return result.meta.changes > 0;
  }
}
