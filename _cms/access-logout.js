// LumeCMS extension: make "Log out" end the Cloudflare Access session.
//
// Injected into every CMS page via the `extraHead` option in _cms.ts.
// LumeCMS's Log out (`$ui.logout()` in its ui.js) was built for its own basic
// auth: it sends a background POST and replaces the page with "Logged out.".
// Here the login is Cloudflare Access, so logging out means ending the Access
// session. Access's per-app logout lives on the app's own hostname at
// /cdn-cgi/access/logout, and ends the session for the CMS only (the team
// domain's logout would end every Access app).
//
// The button's inline onclick runs at the target, so a capturing listener on
// the document sees the click first and can stop it. Only when served through
// Access: on localhost there is no Access and no /cdn-cgi path.

const LOCAL = ["localhost", "127.0.0.1", "[::1]"];

if (!LOCAL.includes(location.hostname)) {
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target instanceof Element
        ? event.target.closest("[onclick*='$ui.logout']")
        : null;
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.assign("/cdn-cgi/access/logout");
    },
    { capture: true },
  );
}
