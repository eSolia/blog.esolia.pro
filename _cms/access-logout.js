// LumeCMS extension: make "Log out" end the Cloudflare Access session, and
// offer a way straight back in.
//
// Injected into every CMS page via the `extraHead` option in _cms.ts.
// LumeCMS's Log out (`$ui.logout()` in its ui.js) was built for its own basic
// auth: it sends a background POST and replaces the page with "Logged out.".
// Here the login is Cloudflare Access, so logging out means ending the Access
// session. Access's per-app logout lives on the app's own hostname at
// /cdn-cgi/access/logout and ends the session for the CMS only (the team
// domain's logout would end every Access app).
//
// Cloudflare's own logged-out page has no link back, so the logout is called
// in the background (the browser applies the cookie it clears) and our own
// page is shown with a "Log in again" button to /admin/.
//
// Access answers the logout with a redirect to the team domain, which is
// cross-origin, so following it makes fetch() reject even though the cookie
// is already cleared. `redirect: "manual"` stops there; the opaque redirect
// counts as success. Whatever happens, our page is shown: its button goes
// through Access, so if the session somehow survived, the worst case is being
// let straight back in. Navigating to the logout URL again is never right; by
// then the cookie is gone and Cloudflare shows "No Access cookie found".
//
// The button's inline onclick runs at the target, so a capturing listener on
// the document sees the click first and can stop it. Only when served through
// Access: on localhost there is no Access and no /cdn-cgi path.

const LOCAL = ["localhost", "127.0.0.1", "[::1]"];
const LOGOUT = "/cdn-cgi/access/logout";

function loggedOutPage() {
  document.title = "ログアウトしました / Logged out";
  document.body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:1rem">
      <div style="max-width:30rem;text-align:center;line-height:1.6">
        <h1 style="font-size:1.4rem;margin:0 0 .75rem">
          ログアウトしました / You are logged out
        </h1>
        <p style="margin:.25rem 0">
          CMS からログアウトしました。続けて作業する場合は、もう一度ログインしてください。
        </p>
        <p lang="en" style="margin:.25rem 0 1rem;opacity:.75">
          You have logged out of the CMS. To keep working, log in again.
        </p>
        <p style="margin:0 0 1.5rem;font-size:.85em;opacity:.65">
          WARP を使っている社内の端末では、入力なしで自動的にログインします。<br>
          <span lang="en">On company devices with WARP, you are signed back in
          automatically, without a prompt.</span>
        </p>
        <button type="button" class="button is-primary" id="cms-login-again">
          もう一度ログイン / Log in again
        </button>
      </div>
    </main>`;
  // A reload, not a link or location.assign(): LumeCMS's navigation.js uses
  // the Navigation API to intercept every navigation to /admin/* and load it
  // with fetch(), which cannot follow Access's redirect to the login on the
  // team domain, so those failed silently. It exempts reloads. The page is
  // still at the /admin/ address it was logged out from, so a reload goes
  // through Access and comes back to it.
  document.getElementById("cms-login-again")?.addEventListener(
    "click",
    () => location.reload(),
  );
}

if (!LOCAL.includes(location.hostname)) {
  document.addEventListener(
    "click",
    async (event) => {
      const target = event.target instanceof Element
        ? event.target.closest("[onclick*='$ui.logout']")
        : null;
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        const response = await fetch(LOGOUT, {
          credentials: "same-origin",
          cache: "no-store",
          redirect: "manual",
        });
        if (response.type !== "opaqueredirect" && !response.ok) {
          console.warn(`[cms] Access logout answered ${response.status}`);
        }
      } catch (error) {
        console.warn("[cms] Access logout request failed", error);
      }
      loggedOutPage();
    },
    { capture: true },
  );
}
