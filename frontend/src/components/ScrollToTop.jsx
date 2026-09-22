/**
 * ScrollToTop.jsx — Route Change Scroll Behavior Handler
 *
 * A non-rendering utility component that manages the browser's scroll
 * position whenever the route changes.
 *
 * Two behaviors:
 *   1. Hash anchor navigation (e.g., /#features):
 *      - Finds the DOM element with the matching id
 *      - Smoothly scrolls it into view after a 100ms delay
 *      - The delay accounts for lazy-loaded sections that may not be in
 *        the DOM yet when the route change fires
 *
 *   2. Normal route change (no hash):
 *      - Instantly resets the scroll position to the top of the page
 *      - Prevents carrying the previous page's scroll position to the new page
 *
 * This component renders null — it only runs the scroll side effect.
 * Placed once in App.jsx (inside the Router, outside the Routes) so it
 * runs on every navigation event.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, hash } = useLocation(); // Track both the path and hash portions of the URL

  useEffect(() => {
    if (hash) {
      // Hash navigation (e.g. clicking "Features" link in the Navbar)
      const id = hash.replace('#', ''); // Strip the leading '#' to get the element id
      const element = document.getElementById(id);
      if (element) {
        // Wait briefly for the DOM / lazy-loaded sections to render
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' }); // Smooth animated scroll to the element
        }, 100);
        return () => clearTimeout(timer); // Cleanup timeout if component unmounts or hash changes again
      }
    } else {
      // No hash — scroll to top of page instantly on route change
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]); // Re-run whenever the route path or hash changes

  return null; // No visual output — purely a side-effect component
}

export default ScrollToTop;
