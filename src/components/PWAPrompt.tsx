"use client";
import { useEffect, useState } from "react";

export default function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => setShowPrompt(false));
  };

  if (!showPrompt) return null;
  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      background: "#22c55e",
      color: "white",
      padding: "1em 2em",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      zIndex: 10000
    }}>
      <span style={{ marginRight: 12 }}>Install Green Receipt as an app?</span>
      <button style={{ background: "white", color: "#22c55e", border: "none", borderRadius: 4, padding: "0.5em 1em", cursor: "pointer" }} onClick={handleInstall}>
        Install
      </button>
      <button style={{ marginLeft: 8, background: "transparent", color: "white", border: "none", cursor: "pointer" }} onClick={() => setShowPrompt(false)}>
        ×
      </button>
    </div>
  );
}
