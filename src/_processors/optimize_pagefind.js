export default function optimizePagefind() {
  return (site) => {
    console.log(">>> optimizePagefind factory function has been called! <<<");

    site.process([".html"], (page) => {
      // NEW: Wrap the entire processing logic for each page in a try...catch block
      try {
        // Initial check for 'page' object validity (though try/catch will also catch this)
        if (!page) {
          console.log(`DEBUG: 'page' object is undefined or null. Skipping processing.`);
          return;
        }

        // Safely log the URL for initial debugging using optional chaining
        console.log(`DEBUG: site.process callback triggered for: ${page.data?.url || 'URL_UNDEFINED_OR_MISSING_DATA'}`);

        // Now, proceed with the logic that previously caused issues.
        // If 'page.document' property access itself (e.g., if 'page' is a primitive or malformed object)
        // throws a TypeError, the outer try...catch will now handle it.
        if (!page.document) { // This is the line that has consistently reported the error
          console.log(`DEBUG: page.document is undefined. Skipping page with URL: ${page.data?.url || 'URL_UNKNOWN'}`);
          return; // Skip this page if there's no document to work with
        }

        const document = page.document; // Assign document after the check

        // Ensure page.data and page.data.url exist before proceeding with URL-based logic.
        if (!page.data || !page.data.url) {
          console.log(`DEBUG: page.data or page.data.url is missing/undefined after document check. Skipping page.`);
          return; // Skip if essential page data is missing
        }

        const pageUrl = page.data.url; // Safely get the URL now

        // Proceed with the main processing logic for HTML pages.
        if (pageUrl.endsWith(".html")) {
          console.log(`DEBUG: Processing HTML page: ${pageUrl}`);

          // --- Script Optimization ---
          const pagefindUIScript = document.querySelector('script[src*="/pagefind/pagefind-ui.js"]');
          if (pagefindUIScript) {
            console.log(`DEBUG: Found pagefind-ui.js script in ${pageUrl}`);
            if (!pagefindUIScript.hasAttribute('async')) {
                pagefindUIScript.setAttribute('async', '');
                console.log("DEBUG: Added 'async' attribute to pagefind-ui.js script.");
            } else {
                console.log("DEBUG: 'async' attribute already present on pagefind-ui.js script.");
            }
          } else {
            console.log(`DEBUG: pagefind-ui.js script NOT found in ${pageUrl}`);
          }

          // --- CSS Optimization ---
          const pagefindUICss = document.querySelector('link[rel="stylesheet"][href*="/pagefind/pagefind-ui.css"]');
          if (pagefindUICss) {
            console.log(`DEBUG: Found pagefind-ui.css link in ${pageUrl}`);
            if (!pagefindUICss.hasAttribute('media') || pagefindUICss.getAttribute('media') !== 'print') {
                pagefindUICss.setAttribute('media', 'print');
                console.log("DEBUG: Added 'media=print' attribute to pagefind-ui.css link.");
            }
            if (!pagefindUICss.hasAttribute('onload') || pagefindUICss.getAttribute('onload') !== 'this.media=\'all\'') {
                pagefindUICss.setAttribute('onload', 'this.media=\'all\'');
                console.log("DEBUG: Added 'onload=this.media=\'all\'' attribute to pagefind-ui.css link.");
            } else {
                console.log("DEBUG: media/onload attributes already present or not needing change for pagefind-ui.css link.");
            }
          } else {
            console.log(`DEBUG: pagefind-ui.css link NOT found in ${pageUrl}`);
          }

          console.log(`--- Finished DOM processing for: ${pageUrl} ---`);

        } else {
          console.log(`DEBUG: Skipping non-HTML page or page not intended for modification: ${pageUrl || 'N/A'}`);
        }
      } catch (error) {
        // Catch any error during page processing for maximum resilience.
        console.error(`ERROR: Failed to process page: ${page?.data?.url || 'URL_UNKNOWN'}. Error: ${error.message}`);
        // You can uncomment the line below if you need the full stack trace for deeper debugging:
        // console.error(error.stack);
      }
    });
  };
}