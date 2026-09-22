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
// page is shown with a "Log in again" button to /admin/. If that call fails,
// fall back to navigating to Cloudflare's page.
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
        <p lang="en" style="margin:.25rem 0 1.5rem;opacity:.75">
          You have logged out of the CMS. To keep working, log in again.
        </p>
        <a class="button is-primary" href="/admin/">
          もう一度ログイン / Log in again
        </a>
      </div>
    </main>`;
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
        });
        if (!response.ok) throw new Error(`logout ${response.status}`);
        loggedOutPage();
      } catch {
        location.assign(LOGOUT);
      }
    },
    { capture: true },
  );
}
