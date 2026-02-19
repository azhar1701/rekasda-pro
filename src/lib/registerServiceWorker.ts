export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available, reloading...');
              window.location.reload();
            }
          });
        }
      });
      
      console.log('Service Worker registered successfully:', registration.scope);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};
