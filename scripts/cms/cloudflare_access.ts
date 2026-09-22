/**
 * LumeCMS auth provider that takes the user from Cloudflare Access.
 *
 * LumeCMS commits every save with `--author=<user>`. With no auth configured
 * the user is anonymous, so every CMS commit was authored as literally
 * `undefined <>`. This provider makes the CMS user whoever signed in to
 * Cloudflare Access, so each commit records who made the edit.
 *
 * InfoSec:
 * - The CMS listens on 127.0.0.1 and is reached only through the Cloudflare
 *   tunnel behind Access, but the identity is still taken from the signed
 *   Access JWT (`Cf-Access-Jwt-Assertion`), never from a plain header such as
 *   `Cf-Access-Authenticated-User-Email`, which anything on the host could
 *   forge. The signature, issuer (the team domain) and audience (the Access
 *   application's AUD tag) are all checked.
 * - It fails closed: a request without a valid token gets 403, not an
 *   anonymous session.
 * - The email and name go into a git `--author` argument (passed as argv, no
 *   shell), so both are validated to a strict character set first.
 *
 * The signed-in person is often not the writer: authors write in Word and one
 * of a couple of editors enters the post. The writer is the post's byline
 * (the Writer dropdown); this records the editor.
 */

import { createRemoteJWKSet, jwtVerify } from "jsr:@panva/jose@6.2.12";
import type { JWTVerifyGetKey } from "jsr:@panva/jose@6.2.12";
import type { AuthProvider, AuthProviderOptions } from "lume/cms/types.ts";

export interface AccessOptions {
  /** e.g. "esolia.cloudflareaccess.com" */
  teamDomain: string;
  /** The Access application's Application Audience (AUD) tag. */
  audience: string;
  /** Email -> display name, e.g. from the Authors list. */
  names?: (email: string) => string | undefined;
  /** Signing keys; defaults to the team's published certs. For tests. */
  keys?: JWTVerifyGetKey;
}

/** A key LumeCMS requires in its users map, never returned by login(). */
export const PLACEHOLDER_USER = "cloudflare-access";

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const NAME = /^[\p{L}\p{M} .'-]{1,80}$/u;

/** "ena.ishikawa@esolia.co.jp" -> "Ena Ishikawa" */
export function nameFromEmail(email: string): string {
  return email.split("@")[0].split(/[._-]+/).filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export class CloudflareAccess implements AuthProvider {
  #options?: AuthProviderOptions;
  #keys: JWTVerifyGetKey;
  #issuer: string;
  #audience: string;
  #names?: (email: string) => string | undefined;

  constructor(options: AccessOptions) {
    this.#issuer = `https://${options.teamDomain}`;
    this.#audience = options.audience;
    this.#names = options.names;
    this.#keys = options.keys ??
      createRemoteJWKSet(new URL(`${this.#issuer}/cdn-cgi/access/certs`));
  }

  init(options: AuthProviderOptions) {
    this.#options = options;
  }

  async login(request: Request): Promise<Response | string> {
    const token = request.headers.get("cf-access-jwt-assertion");
    if (!token) return forbidden("missing Cloudflare Access token");

    let email: string;
    try {
      const { payload } = await jwtVerify(token, this.#keys, {
        issuer: this.#issuer,
        audience: this.#audience,
        algorithms: ["RS256"],
      });
      email = String(payload.email ?? "").toLowerCase();
    } catch (error) {
      return forbidden(`invalid Cloudflare Access token (${error})`);
    }
    if (!EMAIL.test(email)) return forbidden("token has no usable email");

    // LumeCMS only accepts users present in its map, so the signed-in person
    // is added on first sight. There is no password: Access did the login.
    const users = this.#options?.users;
    if (!users) throw new Error("CloudflareAccess used before init()");
    if (!users.has(email)) {
      const listed = this.#names?.(email);
      const name = listed && NAME.test(listed) ? listed : nameFromEmail(email);
      users.set(email, {
        password: "",
        name: NAME.test(name) ? name : email,
        email,
      });
    }
    return email;
  }

  /** Access owns the session, so logging out means logging out of Access. */
  logout(): Response {
    return new Response(null, {
      status: 302,
      headers: { location: "/cdn-cgi/access/logout" },
    });
  }

  fetch(): Response {
    return new Response("Not found", { status: 404 });
  }
}

function forbidden(reason: string): Response {
  // Logged for the server operator; the response itself says nothing useful
  // to whoever sent the request.
  console.warn(`[cms-auth] refused: ${reason}`);
  return new Response("Forbidden", { status: 403 });
}

/**
 * The provider, when the environment configures it (the VPS systemd unit);
 * undefined otherwise, which leaves local development without a login.
 */
export function accessFromEnv(
  names?: (email: string) => string | undefined,
): CloudflareAccess | undefined {
  const teamDomain = Deno.env.get("CMS_ACCESS_TEAM_DOMAIN");
  const audience = Deno.env.get("CMS_ACCESS_AUD");
  if (!teamDomain || !audience) return undefined;
  return new CloudflareAccess({ teamDomain, audience, names });
}
