window.addEventListener('load', (event) => {
  document.querySelectorAll('.data-fatrigger').forEach(item => {
    item.addEventListener('click', event => {
      let postId = item.getAttribute('data-faid');
      fathom.trackEvent(`post link click: ${postId}`);
    });
  });
});