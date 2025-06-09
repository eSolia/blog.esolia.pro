// window.addEventListener('load', (event) => {
//   document.querySelectorAll('.data-fatrigger').forEach(item => {
//     item.addEventListener('click', event => {
//       let postId = item.getAttribute('data-faid');
//       fathom.trackEvent(`post link click: ${postId}`);
//     });
//   });
// });

window.addEventListener("load", () => {
  document.querySelectorAll(".data-fatrigger").forEach((item) => {
    item.addEventListener("click", (event) => {
      let postId = item.getAttribute("data-faid");
      if (typeof fathom !== "undefined") {
        fathom.trackEvent(`post link click: ${postId}`);
      } else {
        console.error("Fathom Analytics script not loaded");
      }
    });
  });
});
