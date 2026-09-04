import { cacheCustomers, cacheProducts, cacheStock, syncPendingItems } from './offlineDB.js';

export async function setupOfflineSync(api) {
  // Only fetch and cache initial data if an access token exists (user is authenticated)
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) {
    try {
      const [productsRes, inventoryRes, customersRes] = await Promise.all([
        api.get('/products', { params: { limit: 500 } }).catch(() => null),
        api.get('/inventory', { params: { limit: 500 } }).catch(() => null),
        api.get('/customers', { params: { limit: 500 } }).catch(() => null),
      ]);
      if (productsRes?.data?.data) await cacheProducts(productsRes.data.data);
      if (inventoryRes?.data?.data) await cacheStock(inventoryRes.data.data);
      if (customersRes?.data?.data) await cacheCustomers(customersRes.data.data);
    } catch (e) {
      // Quietly ignore cache setup errors
    }
  }

  // Listen for online/offline events
  window.addEventListener('online', async () => {
    console.log('[Offline] Back online — syncing pending items...');
    await syncPendingItems(api);
    window.dispatchEvent(new CustomEvent('sync-complete'));
  });

  window.addEventListener('offline', () => {
    console.log('[Offline] Gone offline — queued actions will sync later');
    window.dispatchEvent(new CustomEvent('offline-detected'));
  });
}

export async function isOnline() {
  return navigator.onLine;
}
