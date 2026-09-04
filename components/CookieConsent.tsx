"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("jobnest-cookie-consent");
    if (!consent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleAccept = () => {
    localStorage.setItem("jobnest-cookie-consent", "accepted");
    // In a real app, you would initialize PostHog or other trackers here
    // or trigger an event that the PostHogProvider listens to.
    window.dispatchEvent(new Event("jobnest-consent-accepted"));
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("jobnest-cookie-consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[90] p-5 glass-card rounded-2xl shadow-luxury flex flex-col gap-3 border border-primary/20"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-foreground">We value your privacy</h3>
            <p className="text-xs text-muted-foreground">
              We use cookies to enhance your browsing experience, serve personalized recommendations, and analyze our traffic.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Button variant="outline" size="sm" className="flex-1 text-xs h-9" onClick={handleDecline}>
              Decline
            </Button>
            <Button variant="primary" size="sm" className="flex-1 text-xs h-9" onClick={handleAccept}>
              Accept All
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
