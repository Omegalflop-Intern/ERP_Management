import { EventEmitter } from 'events';

const emitter = new EventEmitter();
emitter.setMaxListeners(20);

export const EVENTS = {
  STOCK_UPDATED: 'stock:updated',
  SALE_COMPLETED: 'sale:completed',
  PURCHASE_RECEIVED: 'purchase:received',
  IMEI_STATUS_CHANGED: 'imei:statusChanged',
  NOTIFICATION_NEW: 'notification:new',
  ATTENDANCE_CHECKED: 'attendance:checked',
  USER_CREATED: 'user:created',
  USER_UPDATED: 'user:updated',
  LOW_STOCK_ALERT: 'lowStock:alert',
  WARRANTY_EXPIRING: 'warranty:expiring',
  TICKET_CREATED: 'ticket:created',
  TICKET_RESOLVED: 'ticket:resolved',
  TENANT_UPDATED: 'tenant:updated',
  PRODUCT_MUTATED: 'product:mutated',
  EXPENSE_MUTATED: 'expense:mutated',
  ACCOUNT_MUTATED: 'account:mutated',
  CUSTOMER_MUTATED: 'customer:mutated',
  REPAIR_MUTATED: 'repair:mutated',
  WARRANTY_MUTATED: 'warranty:mutated',
  USER_MUTATED: 'user:mutated',
};

export default emitter;
