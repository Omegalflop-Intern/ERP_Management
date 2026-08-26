export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });
    });
  }
}
