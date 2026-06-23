// InfoSec: Deno 2.8+ removed MD5 from the native Web Crypto `SubtleCrypto.digest`
// algorithm allowlist. Lume's favicon plugin (and core cache) still request MD5
// purely as a content-addressing/cache key for generated icons — not for
// integrity, signatures, or authentication. We delegate only the MD5 case to
// @std/crypto's Wasm implementation and pass every other algorithm through to
// the native implementation untouched. No security impact: MD5 is used here as a
// non-cryptographic cache hash, never for a security decision.
import { crypto as stdCrypto } from "jsr:@std/crypto@^1";

const nativeDigest = crypto.subtle.digest.bind(crypto.subtle);

crypto.subtle.digest = function (
  algorithm: AlgorithmIdentifier,
  data: BufferSource,
): Promise<ArrayBuffer> {
  const name = typeof algorithm === "string" ? algorithm : algorithm.name;
  if (name?.toUpperCase() === "MD5") {
    return stdCrypto.subtle.digest("MD5", data) as Promise<ArrayBuffer>;
  }
  return nativeDigest(algorithm, data);
};
