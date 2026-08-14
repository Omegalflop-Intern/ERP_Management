import { openDB } from 'idb';

const DB_NAME = 'omni-manage-erp';
const DB_VERSION = 1;

const STORES = {
  PRODUCTS: 'products',
  STOCK: 'stock',
  CUSTOMERS: 'customers',
  PENDING_SALES: 'pendingSales',
  PENDING_ATTENDANCE: 'pendingAttendance',
  PENDING_IMEI_CHECKS: 'pendingIMEIChecks',
  CACHE: 'apiCache',
};

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.PRODUCTS))
          db.createObjectStore(STORES.PRODUCTS, { keyPath: '_id' });
        if (!db.objectStoreNames.contains(STORES.STOCK))
          db.createObjectStore(STORES.STOCK, { keyPath: '_id' });
        if (!db.objectStoreNames.contains(STORES.CUSTOMERS))
          db.createObjectStore(STORES.CUSTOMERS, { keyPath: '_id' });
        if (!db.objectStoreNames.contains(STORES.PENDING_SALES))
          db.createObjectStore(STORES.PENDING_SALES, { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains(STORES.PENDING_ATTENDANCE))
          db.createObjectStore(STORES.PENDING_ATTENDANCE, { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains(STORES.PENDING_IMEI_CHECKS))
          db.createObjectStore(STORES.PENDING_IMEI_CHECKS, { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains(STORES.CACHE))
          db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

// Cache read data for offline use
export async function cacheProducts(products) {
  const db = await getDB();
  const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
  await tx.store.clear();
  for (const p of products) await tx.store.put(p);
  await tx.done;
}

export async function cacheStock(stock) {
  const db = await getDB();
  const tx = db.transaction(STORES.STOCK, 'readwrite');
  await tx.store.clear();
  for (const s of stock) await tx.store.put(s);
  await tx.done;
}

export async function cacheCustomers(customers) {
  const db = await getDB();
  const tx = db.transaction(STORES.CUSTOMERS, 'readwrite');
  await tx.store.clear();
  for (const c of customers) await tx.store.put(c);
  await tx.done;
}

// Offline queue
export async function queueSale(saleData) {
  const db = await getDB();
  return db.add(STORES.PENDING_SALES, { ...saleData, queuedAt: new Date().toISOString() });
}

export async function queueAttendance(data) {
  const db = await getDB();
  return db.add(STORES.PENDING_ATTENDANCE, { ...data, queuedAt: new Date().toISOString() });
}

export async function getPendingSales() {
  const db = await getDB();
  return db.getAll(STORES.PENDING_SALES);
}

export async function getPendingAttendance() {
  const db = await getDB();
  return db.getAll(STORES.PENDING_ATTENDANCE);
}

export async function clearPending(storeName) {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  await tx.store.clear();
  await tx.done;
}

export async function removePendingItem(storeName, id) {
  const db = await getDB();
  return db.delete(storeName, id);
}

export async function getPendingCount() {
  const db = await getDB();
  const sales = await db.getAll(STORES.PENDING_SALES);
  const attendance = await db.getAll(STORES.PENDING_ATTENDANCE);
  return sales.length + attendance.length;
}

// Sync pending items when back online
export async function syncPendingItems(api) {
  const sales = await getPendingSales();
  for (const sale of sales) {
    try {
      await api.post('/sales', sale);
      await removePendingItem(STORES.PENDING_SALES, sale.id);
    } catch (e) {
      console.error('Sync sale failed:', e);
    }
  }
  const attendance = await getPendingAttendance();
  for (const att of attendance) {
    try {
      await api.post('/attendance/check-in', att);
      await removePendingItem(STORES.PENDING_ATTENDANCE, att.id);
    } catch (e) {
      console.error('Sync attendance failed:', e);
    }
  }
}
