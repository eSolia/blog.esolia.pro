import { loadVendorScript } from "hibana/utils/dom_utils.ts";

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

// Swap logo on scroll and make nav bg more opaque
globalThis.addEventListener("scroll", () => {
  const largeLogo = document.getElementById("large-logo");
  const smallLogo = document.getElementById("small-logo");
  const topNavBG = document.getElementById("top-nav-bg");
  const scrollPosition = globalThis.scrollY;

  // Masthead fade, linked to scroll position rather than triggered by it.
  //
  // A threshold plus a CSS transition looked abrupt: crossing 10px ran the
  // whole fade on a timer, so it played out the same way whether you nudged
  // the wheel or flung the page. Driving a 1..0 factor straight from
  // scrollY means the artwork fades exactly as far as you have scrolled, and
  // comes back just as gradually on the way up.
  //
  // One property on the root, read by both the symbol and the connector, so
  // this is a single write per scroll event rather than one per element.
  const HERO_FADE_DISTANCE = 200;
  const heroFade = Math.max(0, 1 - scrollPosition / HERO_FADE_DISTANCE);
  document.documentElement.style.setProperty(
    "--hero-scroll-fade",
    heroFade.toFixed(3),
  );

  // Check if the current screen size is 'md' (768px) or larger
  // (Tailwind's default 'md' breakpoint is 768px)
  const isLargeScreen = globalThis.matchMedia("(min-width: 768px)").matches;

  // --- Handle logo swap only for 'md' and larger screens ---
  //
  // Only the small nav symbol is toggled here. The hero symbol fades from
  // `--hero-scroll-fade` above; it cannot use Tailwind's opacity utilities,
  // because `.hero-symbol` sets opacity from the shared masthead ink and is
  // unlayered, so it outranks them and the utilities did nothing.
  if (isLargeScreen) {
    if (largeLogo && smallLogo) { // Defensive check
      if (scrollPosition > 10) {
        smallLogo.classList.remove("md:opacity-0"); // Show small logo
      } else {
        smallLogo.classList.add("md:opacity-0"); // Hide small logo
      }
    }
  }
  // For small screens, the Tailwind CSS classes now handle visibility:
  // - large-logo is `hidden` by default.
  // - small-logo is `opacity-100` by default.
  // So, no specific JS logic is needed for logos on small screens here.

  // IMPORTANT: Keep these to ensure correct state on load and resize
  globalThis.addEventListener("DOMContentLoaded", () => {
    globalThis.dispatchEvent(new Event("scroll"));
  });
  globalThis.addEventListener("resize", () => {
    globalThis.dispatchEvent(new Event("scroll"));
  });

  // Handle nav opacity changes based on scroll position
  if (scrollPosition > 50) {
    topNavBG.classList.remove(
      "bg-zinc-50/50",
      "dark:bg-zinc-700/50",
      "bg-zinc-50/70",
      "dark:bg-zinc-700/70",
    );
    topNavBG.classList.add("bg-zinc-50/95", "dark:bg-zinc-700/95");
  } else if (scrollPosition > 30 && scrollPosition <= 50) {
    topNavBG.classList.remove(
      "bg-zinc-50/50",
      "dark:bg-zinc-700/50",
      "bg-zinc-50/95",
      "dark:bg-zinc-700/95",
    );
    topNavBG.classList.add("bg-zinc-50/70", "dark:bg-zinc-700/70");
  } else if (scrollPosition > 10 && scrollPosition <= 30) {
    topNavBG.classList.remove(
      "bg-zinc-50/70",
      "dark:bg-zinc-700/70",
      "bg-zinc-50/95",
      "dark:bg-zinc-700/95",
    );
    topNavBG.classList.add("bg-zinc-50/50", "dark:bg-zinc-700/50");
  } else {
    topNavBG.classList.remove(
      "bg-zinc-50/70",
      "dark:bg-zinc-700/70",
      "bg-zinc-50/95",
      "dark:bg-zinc-700/95",
    );
    topNavBG.classList.add("bg-zinc-50/50", "dark:bg-zinc-700/50");
  }
});

// Theme Toggle with Alpine.js
document.addEventListener("alpine:init", () => {
  Alpine.data("themeToggle", () => ({
    darkMode: localStorage.getItem("darkMode") === "true" || false,
    init() {
      this.$watch("darkMode", (value) => {
        localStorage.setItem("darkMode", value);
        document.body.classList.toggle("dark", value);
      });
      // Ensure the correct class is applied on page load
      document.body.classList.toggle("dark", this.darkMode);
    },
  }));
});

// Load Mastodon Comments from a local file
//import Comments from "./comments.js";
//customElements.define("mastodon-comments", Comments);

// Load Alpine.js with defer
loadVendorScript(
  "https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js",
  { "defer": "" },
  function () {
    console.log("Alpine.js loaded with defer");
  },
);

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
const searchButton = document.getElementById("search-button");
const searchClose = document.getElementById("modal-close");

if (searchModal && searchButton) {
  // What had focus before the dialog opened, so it can be handed back on
  // close. Without this, closing the modal drops focus to the top of the
  // document and a keyboard user loses their place entirely.
  let lastFocused = null;

  const isOpen = () => searchModal.style.display === "block";

  const focusablesIn = (root) =>
    [...root.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
    )].filter((el) => el.offsetParent !== null);

  const openSearch = () => {
    lastFocused = document.activeElement;
    searchModal.style.display = "block";
    searchModal.setAttribute("aria-hidden", "false");
    // Pagefind builds its input lazily, so it may not exist on first open.
    const input = searchModal.querySelector(".pagefind-ui__search-input");
    (input ?? focusablesIn(searchModal)[0] ?? searchModal).focus();
  };

  const closeSearch = () => {
    searchModal.style.display = "none";
    searchModal.setAttribute("aria-hidden", "true");
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
