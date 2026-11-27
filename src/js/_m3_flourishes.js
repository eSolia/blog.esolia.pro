/**
 * Framework-agnostic Material 3 micro-interaction flourishes for blog.esolia.pro (Lume).
 * Mirrors `src/lib/m3/flourishes.ts` & `easing.ts` in `esolia-2025`.
 */

export const M3_EASING_CSS = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  standardDecelerate: "cubic-bezier(0, 0, 0, 1)",
  emphasizedDecelerate: "cubic-bezier(0.05, 0.7, 0.1, 1)",
  emphasizedAccelerate: "cubic-bezier(0.3, 0, 0.8, 0.15)",
  spring:
    "linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.036 22.7%, 1.028 27%, 1.005 38%, 0.999 48%, 1)",
};

const DEFAULT_RIPPLE_SELECTOR =
  ".m3-ripple, .m3-btn-filled, .m3-nav-pill, .m3-icon-btn, .m3-chip, details > summary, [data-m3-ripple]";

const CENTERED_RIPPLE_SELECTOR = ".m3-icon-btn, [data-m3-ripple='center']";

function prefersReducedMotion() {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isDisabledControl(el) {
  return (
    el.hasAttribute("disabled") ||
    el.getAttribute("aria-disabled") === "true" ||
    el.hasAttribute("data-m3-no-ripple")
  );
}

function computeRippleGeometry(rect, clientX, clientY, centered) {
  const x = centered || clientX === null
    ? rect.width * 0.5
    : clientX - rect.left;
  const y = centered || clientY === null
    ? rect.height * 0.5
    : clientY - rect.top;
  const maxDx = Math.max(x, rect.width - x);
  const maxDy = Math.max(y, rect.height - y);
  const radius = Math.hypot(maxDx, maxDy);
  const size = Math.max(radius * 2, 24);
  return {
    size,
    x: x - size * 0.5,
    y: y - size * 0.5,
  };
}

function spawnRippleWave(target, clientX, clientY, forceCentered = false) {
  if (prefersReducedMotion() || isDisabledControl(target)) return;

  const rect = target.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const computedPos = globalThis.getComputedStyle(target).position;
  if (computedPos === "static") {
    target.style.position = "relative";
  }

  const centered = forceCentered || target.matches(CENTERED_RIPPLE_SELECTOR);
  const { size, x, y } = computeRippleGeometry(
    rect,
    clientX,
    clientY,
    centered,
  );

  const wave = document.createElement("span");
  wave.className = "m3-ripple-wave";
  wave.setAttribute("aria-hidden", "true");
  wave.style.width = `${size}px`;
  wave.style.height = `${size}px`;
  wave.style.left = `${x}px`;
  wave.style.top = `${y}px`;
  target.appendChild(wave);

  const startedAt = performance.now();
  const minHoldMs = 150;
  let released = false;
  let cleanedUp = false;

  const removeWave = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    wave.remove();
  };

  if (typeof wave.animate !== "function") {
    setTimeout(removeWave, 280);
    return;
  }

  const expandAnim = wave.animate(
    [
      { transform: "scale(0.18)", opacity: "0" },
      { transform: "scale(1)", opacity: "var(--m3-ripple-opacity, 0.10)" },
    ],
    {
      duration: 340,
      easing: M3_EASING_CSS.standard,
      fill: "forwards",
    },
  );

  const dissolve = () => {
    if (released) return;
    released = true;
    const elapsed = performance.now() - startedAt;
    const waitMs = Math.max(0, minHoldMs - elapsed);

    setTimeout(() => {
      if (cleanedUp) return;
      const fadeAnim = wave.animate(
        [{ opacity: "var(--m3-ripple-opacity, 0.10)" }, { opacity: "0" }],
        {
          duration: 240,
          easing: M3_EASING_CSS.standardDecelerate,
          fill: "forwards",
        },
      );
      fadeAnim.addEventListener("finish", removeWave, { once: true });
      setTimeout(removeWave, 320);
    }, waitMs);
  };

  if (clientX === null && clientY === null) {
    dissolve();
  } else {
    const onRelease = () => {
      globalThis.removeEventListener("pointerup", onRelease, true);
      globalThis.removeEventListener("pointercancel", onRelease, true);
      target.removeEventListener("pointerleave", onRelease);
      dissolve();
    };
    globalThis.addEventListener("pointerup", onRelease, {
      capture: true,
      once: true,
    });
    globalThis.addEventListener("pointercancel", onRelease, {
      capture: true,
      once: true,
    });
    target.addEventListener("pointerleave", onRelease, { once: true });
  }

  expandAnim.addEventListener("cancel", removeWave, { once: true });
}

export function initM3Ripples(options = {}) {
  if (typeof document === "undefined") return () => {};

  const root = options.root ?? document;
  const selector = options.selector ?? DEFAULT_RIPPLE_SELECTOR;

  function onPointerDown(e) {
    if (e.button !== 0) return;
    if (!(e.target instanceof Element)) return;
    const match = e.target.closest(selector);
    if (!match) return;
    spawnRippleWave(match, e.clientX, e.clientY);
  }

  function onKeyDown(e) {
    if (e.repeat || (e.key !== "Enter" && e.key !== " ")) return;
    if (!(e.target instanceof HTMLElement)) return;
    if (!e.target.matches(selector)) return;
    spawnRippleWave(e.target, null, null, true);
  }

  root.addEventListener("pointerdown", onPointerDown, { passive: true });
  root.addEventListener("keydown", onKeyDown, { passive: true });

  return () => {
    root.removeEventListener("pointerdown", onPointerDown);
    root.removeEventListener("keydown", onKeyDown);
  };
}
