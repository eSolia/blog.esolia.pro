import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
} from "jsr:@panva/jose@6.2.12";
import {
  CloudflareAccess,
  nameFromEmail,
} from "../scripts/cms/cloudflare_access.ts";
import type { UserConfiguration } from "lume/cms/types.ts";

const TEAM = "esolia.cloudflareaccess.com";
const AUD = "test-aud";

async function setup() {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
  const keys = createLocalJWKSet({ keys: [jwk] });
  const users = new Map<string, UserConfiguration>();
  const provider = new CloudflareAccess({
    teamDomain: TEAM,
    audience: AUD,
    keys,
    names: (email) =>
      email === "ena.ishikawa@esolia.co.jp" ? "Ena Ishikawa" : undefined,
  });
  provider.init({ basePath: "/admin", users });
  const sign = (claims: Record<string, unknown>, opts: {
    iss?: string;
    aud?: string;
    exp?: string;
    key?: CryptoKey;
  } = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer(opts.iss ?? `https://${TEAM}`)
      .setAudience(opts.aud ?? AUD)
      .setIssuedAt()
      .setExpirationTime(opts.exp ?? "5m")
      .sign(opts.key ?? privateKey);
  const request = (token?: string) =>
    new Request("http://127.0.0.1:3000/admin/", {
      headers: token ? { "cf-access-jwt-assertion": token } : {},
    });
  return { provider, users, sign, request };
}

Deno.test("a valid token logs in as the email, named from the Authors list", async () => {
  const { provider, users, sign, request } = await setup();
  const result = await provider.login(
    request(await sign({ email: "Ena.Ishikawa@esolia.co.jp" })),
  );
  assertEquals(result, "ena.ishikawa@esolia.co.jp");
  assertEquals(users.get("ena.ishikawa@esolia.co.jp")?.name, "Ena Ishikawa");
});

Deno.test("an unlisted email is named from first.last", async () => {
  const { provider, users, sign, request } = await setup();
  await provider.login(
    request(await sign({ email: "rick.cogley@esolia.co.jp" })),
  );
  assertEquals(users.get("rick.cogley@esolia.co.jp")?.name, "Rick Cogley");
  assertEquals(nameFromEmail("yanquan.ma@esolia.co.jp"), "Yanquan Ma");
});

Deno.test("refused: no token, wrong audience, wrong issuer, expired, forged", async () => {
  const { provider, sign, request } = await setup();
  const other = await generateKeyPair("RS256");
  const bad = [
    undefined,
    await sign({ email: "a.b@esolia.co.jp" }, { aud: "another-app" }),
    await sign({ email: "a.b@esolia.co.jp" }, {
      iss: "https://evil.cloudflareaccess.com",
    }),
    await sign({ email: "a.b@esolia.co.jp" }, { exp: "-1m" }),
    await sign({ email: "a.b@esolia.co.jp" }, { key: other.privateKey }),
    "not-a-jwt",
  ];
  for (const token of bad) {
    const result = await provider.login(request(token));
    assert(result instanceof Response, `accepted ${token}`);
    assertEquals(result.status, 403);
  }
});

Deno.test("refused: an email that could break the git --author argument", async () => {
  const { provider, sign, request } = await setup();
  for (const email of ["x <evil@x.com>", "a\nb@esolia.co.jp", "", undefined]) {
    const result = await provider.login(request(await sign({ email })));
    assert(result instanceof Response, `accepted ${JSON.stringify(email)}`);
  }
});
