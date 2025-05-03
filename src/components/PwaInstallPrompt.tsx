import React, { useEffect, useState } from 'react';

/**
 * A floating PWA install button for desktop and mobile browsers that support installation.
 * Shows only when the install prompt is available and app is not already installed.
 */
export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    // Hide prompt if app is installed
    window.addEventListener('appinstalled', () => setShowPrompt(false));
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Hide if running as standalone (already installed)
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <button
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 9999,
        background: '#22c55e',
        color: 'white',
        border: 'none',
        borderRadius: 8,
        padding: '12px 20px',
        fontSize: 18,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        cursor: 'pointer'
      }}
      onClick={async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
      }}
    >
      📲 Install App
    </button>
  );
}
