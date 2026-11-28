import { loadVendorScript } from "hibana/utils/dom_utils.ts";
import { initM3Ripples } from "./_m3_flourishes.js";

initM3Ripples();

// Load this first.
//
// Only Windows is tagged, because only `body.os-windows` has any CSS behind
// it: three rules in styles.css that bump the lede and nav to a heavier
// weight, working around text rendering thin and blurry on Windows. The
// earlier version of this block also tagged Windows Phone, Android, iOS and
// macOS, but nothing ever styled those four classes, so they were dead hooks.
//
// `globalThis.opera` went with them — that was for Presto-era Opera, which
// has not existed since 2013 — as did the Windows Phone branch, which
// Microsoft stopped supporting in 2019.
//
// This is user-agent sniffing, which is normally the wrong tool. It is kept
// because the problem it solves is a platform font-rasterization difference
// that no feature query can detect.
(function () {
  const userAgent = navigator.userAgent || navigator.vendor;

  if (/Win/i.test(userAgent)) {
    document.body.classList.add("os-windows");
  }
})();

// Swap logo on scroll, make nav bg more opaque, and toggle back-to-top FAB.
//
// Cached DOM references, passive listener, requestAnimationFrame coalescing,
// and state-change guards keep mobile touch scrolling entirely off the main
// thread once past the 200px masthead fade zone.
const scrollTopBtn = document.getElementById("scroll-to-top");
const largeLogo = document.getElementById("large-logo");
const smallLogo = document.getElementById("small-logo");
const topNavBG = document.getElementById("top-nav-bg");
const mdQuery = globalThis.matchMedia("(min-width: 768px)");
let isLargeScreen = mdQuery.matches;

scrollTopBtn?.addEventListener("click", () => {
  const reduceMotion =
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
  globalThis.scrollTo({
    top: 0,
    behavior: reduceMotion ? "auto" : "smooth",
  });
});

const HERO_FADE_DISTANCE = 200;
let lastHeroFadeStr = "";
let navBand = -1;
let scrollTicking = false;

function applyScrollState() {
  scrollTicking = false;
  const scrollPosition = globalThis.scrollY;

  if (scrollTopBtn) {
    const shouldHide = scrollPosition <= 600;
    if (shouldHide) {
      if (!scrollTopBtn.hasAttribute("data-hidden")) {
        scrollTopBtn.setAttribute("data-hidden", "true");
      }
    } else if (scrollTopBtn.hasAttribute("data-hidden")) {
      scrollTopBtn.removeAttribute("data-hidden");
    }
  }

  // Masthead fade, linked to scroll position rather than triggered by it.
  //
  // Driving a 1..0 factor straight from scrollY means the artwork fades
  // exactly as far as you have scrolled, and comes back gradually on the way
  // up. Guarded against lastHeroFadeStr so scrolling past 200px performs zero
  // style mutations for the rest of the article.
  const heroFade = Math.max(0, 1 - scrollPosition / HERO_FADE_DISTANCE);
  const heroFadeStr = heroFade.toFixed(3);
  if (heroFadeStr !== lastHeroFadeStr) {
    lastHeroFadeStr = heroFadeStr;
    document.documentElement.style.setProperty(
      "--hero-scroll-fade",
      heroFadeStr,
    );
  }

  // --- Handle logo swap only for 'md' and larger screens ---
  if (isLargeScreen && largeLogo && smallLogo) {
    if (scrollPosition > 10) {
      smallLogo.classList.remove("md:opacity-0");
    } else {
      smallLogo.classList.add("md:opacity-0");
    }
  }

  // Handle nav opacity changes based on scroll position
  if (topNavBG) {
    const nextBand = scrollPosition > 50 ? 2 : scrollPosition > 30 ? 1 : 0;
    if (nextBand !== navBand) {
      navBand = nextBand;
      topNavBG.classList.toggle("bg-surface/50", nextBand === 0);
      topNavBG.classList.toggle("bg-surface/75", nextBand === 1);
      topNavBG.classList.toggle("bg-surface/94", nextBand === 2);
    }
  }
}

function onScroll() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(applyScrollState);
}

globalThis.addEventListener("scroll", onScroll, { passive: true });

mdQuery.addEventListener("change", (e) => {
  isLargeScreen = e.matches;
  applyScrollState();
});

// Sync the nav and logo to the current scroll position once at startup, and
// again on resize — the logo swap is breakpoint-dependent, so crossing the md
// boundary has to be re-evaluated.
const syncNavToScroll = () => applyScrollState();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", syncNavToScroll, {
    once: true,
  });
} else {
  syncNavToScroll();
}

globalThis.addEventListener("resize", syncNavToScroll);

// Remember an explicit language choice, the way the main site's switcher does.
//
// esolia.co.jp serves /blog/* and sends a visitor whose browser prefers
// English from /blog/ to /blog/en/, the same as it does at the site root. A
// saved `lang` cookie overrides that, and the main site's own switcher
// (TopNav.svelte) writes one before navigating — but the blog's switcher is a
// plain link, so clicking 日本語 landed on /blog/ and was redirected straight
// back, which reads as a dead button.
//
// Same cookie name, path, lifetime and SameSite as the main site, so one
// choice holds across both. Written on the switcher links only, which are the
// ones carrying hreflang.
document.addEventListener("click", (event) => {
  const link = event.target instanceof Element
    ? event.target.closest("a[hreflang]")
    : null;
  const lang = link?.getAttribute("hreflang");
  if (lang !== "ja" && lang !== "en") return;
  document.cookie = `lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
});

// Theme toggle, without a framework.
//
// The `dark` class on <html> is the single source of truth, and an inline
// boot script in base.vto sets it before the first paint. Every toggle button
// in the page carries `data-theme-toggle`, and which icon each one shows is
// decided by CSS from that class — so the buttons hold no state of their own,
// there is nothing to keep in sync between the desktop and drawer copies, and
// nothing flashes while this module loads.
//
// The stored preference is the main site's `theme` key, not a blog-only one:
// esolia.co.jp serves both this blog and the main site, so they share an
// origin and therefore localStorage, and a reader who picks dark here should
// keep it when they click through to the main site. `darkMode` is the blog's
// older key, still written so an older cached page agrees with this one.
function applyTheme(dark) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
  localStorage.setItem("darkMode", String(dark));
  globalThis.dispatchEvent(new CustomEvent("theme-change", { detail: dark }));
}

document.addEventListener("click", (event) => {
  const button = event.target instanceof Element
    ? event.target.closest("[data-theme-toggle]")
    : null;
  if (!button) return;
  applyTheme(!document.documentElement.classList.contains("dark"));
});

// Drawer navigation for narrow viewports.
//
// The focus handling here is the part that matters. A dialog that traps
// nothing lets Tab walk out into the page behind it, which for a screen
// reader or keyboard user means the menu is still "open" while focus is
// somewhere they cannot see. The search modal got this treatment in #323;
// this menu never did.
//
// Closed is the markup's resting state — the panel is translated off-screen
// and `invisible`, which also takes its links out of the tab order — so this
// only has to flip classes and manage focus.
function initMobileMenu() {
  const root = document.querySelector("[data-menu-root]");
  const panel = root?.querySelector("[data-menu-panel]");
  const backdrop = root?.querySelector("[data-menu-backdrop]");
  const closeBtn = root?.querySelector("[data-menu-close]");
  const triggers = document.querySelectorAll("[data-menu-toggle]");
  if (!root || !panel || !backdrop) return;

  let open = false;
  let lastFocused = null;

  const show = () => {
    if (open) return;
    open = true;
    lastFocused = document.activeElement;
    // Make it visible first, then transition on the next frame: a transition
    // from `invisible` in the same frame is not animated.
    panel.classList.remove("invisible");
    backdrop.classList.remove("invisible");
    requestAnimationFrame(() => {
      panel.classList.remove("translate-x-full");
      backdrop.classList.remove("opacity-0");
    });
    document.body.style.overflow = "hidden";
    triggers.forEach((t) => t.setAttribute("aria-expanded", "true"));
    closeBtn?.focus();
  };

  const close = () => {
    if (!open) return;
    open = false;
    panel.classList.add("translate-x-full");
    backdrop.classList.add("opacity-0");
    document.body.style.overflow = "";
    triggers.forEach((t) => t.setAttribute("aria-expanded", "false"));
    // Hide only once the slide has finished, or the panel vanishes mid-transition.
    const hide = () => {
      if (open) return;
      panel.classList.add("invisible");
      backdrop.classList.add("invisible");
    };
    panel.addEventListener("transitionend", hide, { once: true });
    // A fallback for reduced-motion settings, where no transition fires.
    setTimeout(hide, 300);
    // Return focus to whatever opened the drawer, not to the top of the
    // document — otherwise the user loses their place.
    lastFocused?.focus?.();
  };

  triggers.forEach((trigger) =>
    trigger.addEventListener("click", () => open ? close() : show())
  );
  closeBtn?.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  document.addEventListener("keydown", (event) => {
    if (!open) return;
    if (event.key === "Escape") {
      close();
      return;
    }
    // Keep Tab inside the panel while it is open.
    if (event.key !== "Tab") return;
    const focusable = panel.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMobileMenu, { once: true });
} else {
  initMobileMenu();
}

// Load Mastodon Comments from a local file
//import Comments from "./comments.js";
//customElements.define("mastodon-comments", Comments);

// Load Fathom Analytics script with data-site attribute and defer
loadVendorScript("https://cdn.usefathom.com/script.js", {
  "data-site": "OIXGEUHR",
  "defer": "",
}, function () {
  console.log("Fathom Analytics loaded with defer and data-site attribute");
});

// Handle keydown event for anchor tags with role="button"
const buttons = document.querySelectorAll('a[role="button"]');
buttons.forEach((button) => {
  button.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      this.click();
    }
  });
});

// Search modal
//
// Rewritten from a set of `.onclick =` assignments into one guarded module.
// Three things it now does that it did not before:
//
//   - Guards on the elements. The old code assigned `searchButton.onclick`
//     unconditionally, so a page without the button would throw a TypeError
//     and take out everything after it in this file, including the TOC
//     handler. Nothing shipped that way — the only pages lacking the button
//     are redirect stubs that never load this script — but the failure mode
//     was one missing element away.
//   - `addEventListener` instead of assignment, which does not clobber other
//     handlers on the same target.
//   - Focus management, below.
const searchModal = document.getElementById("searchModal");
const searchPanel = searchModal?.querySelector("[data-search-panel]");
const searchButton = document.getElementById("search-button");
const searchClose = document.getElementById("modal-close");

if (searchModal && searchButton) {
  // What had focus before the dialog opened, so it can be handed back on
  // close. Without this, closing the modal drops focus to the top of the
  // document and a keyboard user loses their place entirely.
  let lastFocused = null;
  let searchOpen = false;

  const isOpen = () => searchOpen;

  const focusablesIn = (root) =>
    [...root.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
    )].filter((el) => el.offsetParent !== null);

  const openSearch = () => {
    if (searchOpen) return;
    searchOpen = true;
    lastFocused = document.activeElement;
    searchModal.classList.remove("invisible", "hidden");
    searchModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      searchModal.classList.remove("opacity-0");
      searchPanel?.classList.remove("scale-95", "opacity-0");
      // Pagefind builds its input lazily, so it may not exist on first open.
      const input = searchModal.querySelector(".pagefind-ui__search-input");
      (input ?? focusablesIn(searchModal)[0] ?? searchModal).focus();
    });
  };

  const closeSearch = () => {
    if (!searchOpen) return;
    searchOpen = false;
    searchModal.classList.add("opacity-0");
    searchPanel?.classList.add("scale-95", "opacity-0");
    searchModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    const hide = () => {
      if (searchOpen) return;
      searchModal.classList.add("invisible", "hidden");
    };
    searchModal.addEventListener("transitionend", hide, { once: true });
    setTimeout(hide, 240);
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    lastFocused = null;
  };

  searchButton.addEventListener("click", openSearch);
  searchClose?.addEventListener("click", closeSearch);

  // Click on the backdrop itself, not on the dialog content inside it.
  searchModal.addEventListener("click", (event) => {
    if (event.target === searchModal) closeSearch();
  });

  document.addEventListener("keydown", (event) => {
    // Cmd+K on macOS, Ctrl+K elsewhere. Checking both modifiers avoids
    // navigator.platform, which is deprecated and lies under emulation.
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
      return;
    }

    if (!isOpen()) return;

    if (event.key === "Escape") {
      closeSearch();
      return;
    }

    // Trap Tab inside the dialog. A dialog the user can tab out of, while the
    // page behind it stays interactive, is worse than no dialog: focus goes
    // somewhere invisible and there is no way back.
    if (event.key === "Tab") {
      const items = focusablesIn(searchModal);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

// For TOC details opening
// This script will automatically open the Table of Contents (ToC) on medium and larger screens
document.addEventListener("DOMContentLoaded", () => {
  const tocDetails = document.getElementById("toc-details");
  if (!tocDetails) {
    // No TOC on this page (home/listing pages) — nothing to do.
    return;
  }
  const handleDetailsState = () => {
    const isMediumOrLargeScreen =
      globalThis.matchMedia("(min-width: 768px)").matches;

    if (isMediumOrLargeScreen) {
      // On medium and larger screens:
      // The 'open' attribute is set in the HTML. We DO NOT modify it here.
      // This allows the user to freely open/close the ToC, and their action will persist.
    } else {
      // On smaller screens:
      // Ensure the ToC is always closed by default (remove 'open' if present).
      tocDetails.removeAttribute("open");
    }
  };
  // Set initial state on page load
  handleDetailsState();
  // Re-evaluate state on window resize
  globalThis.addEventListener("resize", handleDetailsState);
});
