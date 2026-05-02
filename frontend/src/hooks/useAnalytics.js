import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Mount once inside <BrowserRouter>. Fires a GA4 page_view on every
 * client-side route change (the initial load is already tracked by the
 * inline gtag config in index.html).
 */
const GA_ID = "G-Y3NS290P8Z";

const useAnalytics = () => {
  const location = useLocation();
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("config", GA_ID, {
      page_path: location.pathname + location.search,
    });
  }, [location]);
};

export default useAnalytics;
