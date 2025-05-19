// Function to load a script from a CDN with additional attributes
function loadVendorScript(src, attributes, callback) {
  var script = document.createElement('script');
  script.src = src;
  // script.async = true;
  // Set additional attributes
  for (var key in attributes) {
      if (attributes.hasOwnProperty(key)) {
          script.setAttribute(key, attributes[key]);
      }
  }
  script.onload = callback;
  document.head.appendChild(script);
}
  
// Swap logo on scroll and make nav bg more opaque
window.addEventListener('scroll', () => {
  const largeLogo = document.getElementById('large-logo');
  const smallLogo = document.getElementById('small-logo');
  const topNavBG = document.getElementById('top-nav-bg');
  const scrollPosition = window.scrollY;

  // Check if the current screen size is 'md' (768px) or larger
  // (Tailwind's default 'md' breakpoint is 768px)
  const isLargeScreen = window.matchMedia('(min-width: 768px)').matches;

  // --- Handle logo swap only for 'md' and larger screens ---
  if (isLargeScreen) {
    if (largeLogo && smallLogo) { // Defensive check
      if (scrollPosition > 10) {
        largeLogo.classList.remove('md:opacity-100'); // Remove large logo opacity
        largeLogo.classList.add('opacity-0');    // Hide large logo
        smallLogo.classList.remove('md:opacity-0'); // Show small logo
      } else {
        largeLogo.classList.remove('opacity-0'); // Show large logo
        largeLogo.classList.add('md:opacity-100'); // Set large logo opacity
        smallLogo.classList.add('md:opacity-0');    // Hide small logo
      }
    }
  }
  // For small screens, the Tailwind CSS classes now handle visibility:
  // - large-logo is `hidden` by default.
  // - small-logo is `opacity-100` by default.
  // So, no specific JS logic is needed for logos on small screens here.

  // IMPORTANT: Keep these to ensure correct state on load and resize
  window.addEventListener('DOMContentLoaded', () => {
      window.dispatchEvent(new Event('scroll'));
  });
  window.addEventListener('resize', () => {
      window.dispatchEvent(new Event('scroll'));
  });

  // Handle nav opacity changes based on scroll position
  if (scrollPosition > 50) {
      topNavBG.classList.remove('bg-zinc-50/50', 'dark:bg-zinc-700/50', 'bg-zinc-50/70', 'dark:bg-zinc-700/70');
      topNavBG.classList.add('bg-zinc-50/95', 'dark:bg-zinc-700/95');
  } else if (scrollPosition > 30 && scrollPosition <= 50) {
      topNavBG.classList.remove('bg-zinc-50/50', 'dark:bg-zinc-700/50', 'bg-zinc-50/95', 'dark:bg-zinc-700/95');
      topNavBG.classList.add('bg-zinc-50/70', 'dark:bg-zinc-700/70');
  } else if (scrollPosition > 10 && scrollPosition <= 30) {
      topNavBG.classList.remove('bg-zinc-50/70', 'dark:bg-zinc-700/70', 'bg-zinc-50/95', 'dark:bg-zinc-700/95');
      topNavBG.classList.add('bg-zinc-50/50', 'dark:bg-zinc-700/50');
  } else {
      topNavBG.classList.remove('bg-zinc-50/70', 'dark:bg-zinc-700/70', 'bg-zinc-50/95', 'dark:bg-zinc-700/95');
      topNavBG.classList.add('bg-zinc-50/50', 'dark:bg-zinc-700/50');
  }
});

// Theme Toggle with Alpine.js
document.addEventListener('alpine:init', () => {
  Alpine.data('themeToggle', () => ({
      darkMode: localStorage.getItem('darkMode') === 'true' || false,
      init() {
          this.$watch('darkMode', value => {
              localStorage.setItem('darkMode', value);
              document.body.classList.toggle('dark', value);
          });
          // Ensure the correct class is applied on page load
          document.body.classList.toggle('dark', this.darkMode);
      }
  }));
});
  
// Load Mastodon Comments from a local file
import Comments from "./comments.js";
customElements.define("mastodon-comments", Comments);

// Load Alpine.js with defer
loadVendorScript('https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js', { 'defer': '' }, function() {
  console.log('Alpine.js loaded with defer');
});

// Load Fathom Analytics script with data-site attribute and defer
loadVendorScript('https://cdn.usefathom.com/script.js', { 'data-site': 'OIXGEUHR', 'defer': '' }, function() {
  console.log('Fathom Analytics loaded with defer and data-site attribute');
});

// Handle keydown event for anchor tags with role="button"
const buttons = document.querySelectorAll('a[role="button"]');
buttons.forEach(button => {
  button.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      this.click();
    }
  });
});

// Search modal
const modal = document.getElementById("searchModal");
const searchButton = document.getElementById("search-button"); // Select the button by its ID
const close = document.getElementById("modal-close");

searchButton.onclick = function() { // Change the event listener target to the button
  modal.style.display = "block";
  // Focus on the Pagefind input if it exists after the modal is shown
  const pageFind = modal.querySelector(".pagefind-ui__search-input");
  if (pageFind) {
    pageFind.focus();
  }
}
close.onclick = function () {
  modal.style.display = "none";
}
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
// Close modal on Escape key press
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' || event.keyCode === 27) { // Check for Escape key
    if (modal.style.display === 'block') {
    modal.style.display = 'none';
    }
 }
});
// Open modal on Cmd+K (Mac) or Ctrl+K (Windows/Linux)
document.addEventListener('keydown', function(event) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

    if (isCmdOrCtrl && event.key === 'k') {
        event.preventDefault(); // Prevent browser's default search shortcut
        modal.style.display = 'block';
        const pageFind = modal.querySelector(".pagefind-ui__search-input");
        if (pageFind) {
        pageFind.focus();
        }
    }
});