
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import API from "../services/api";

function getVisitorId() {
  let visitorId = localStorage.getItem("nie_visitor_id");

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("nie_visitor_id", visitorId);
  }

  return visitorId;
}

function getSessionId() {
  let sessionId = sessionStorage.getItem("nie_session_id");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("nie_session_id", sessionId);
  }

  return sessionId;
}

function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    // Ignore admin pages and admin login.
    if (
      location.pathname.startsWith("/admin") ||
      location.pathname === "/manage-portal"
    ) {
      return;
    }

    const trackPageView = async () => {
      try {
        await API.post("/analytics/track", {
          event_type: "page_view",
          visitor_id: getVisitorId(),
          session_id: getSessionId(),
          page_path: location.pathname,
        });
      } catch (error) {
        console.error("Page view tracking failed:", error);
      }
    };

    trackPageView();
  }, [location.pathname]);

  return null;
}

export default PageViewTracker;
