// PWA utility functions

// Check if the app is running as a PWA
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
};

// Check if the app can be installed
export const canInstallPWA = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Install PWA prompt handler
let deferredPrompt = null;

export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
};

export const showInstallPrompt = async () => {
  if (!deferredPrompt) {
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`User response to the install prompt: ${outcome}`);
  
  // Clear the deferredPrompt variable
  deferredPrompt = null;
  
  return outcome === 'accepted';
};

// Offline detection
export const isOnline = () => navigator.onLine;

export const setupOfflineDetection = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

// Service Worker utilities
export const updateServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.update();
    }
  }
};

export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      return registration.unregister();
    }
  }
  return false;
};

// Cache management
export const clearAppCache = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
};

// Initialize PWA features
export const initializePWA = () => {
  setupInstallPrompt();
  
  // Log PWA status
  console.log('PWA Status:', {
    isPWA: isPWA(),
    canInstall: canInstallPWA(),
    isOnline: isOnline(),
  });
};