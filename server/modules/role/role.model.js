import mongoose from 'mongoose';

const ALL_PERMISSIONS = [
  'dashboard:view',
  'sales:view', 'sales:create', 'sales:delete',
  'products:view', 'products:create', 'products:edit', 'products:delete',
  'categories:view', 'categories:manage',
  'inventory:view', 'inventory:manage',
  'stock:view', 'stock:transfer',
  'customers:view', 'customers:manage',
  'suppliers:view', 'suppliers:manage',
  'purchases:view', 'purchases:manage',
  'accounting:view', 'accounting:manage',
  'employees:view', 'employees:manage',
  'attendance:view', 'attendance:manage',
  'leaves:view', 'leaves:manage',
  'payroll:view', 'payroll:manage',
  'repairs:view', 'repairs:manage',
  'warranties:view', 'warranties:manage',
  'wholesale:view', 'wholesale:manage',
  'notifications:view', 'notifications:manage',
  'reports:view',
  'users:view', 'users:manage',
  'roles:view', 'roles:manage',
  'branches:view', 'branches:manage',
  'settings:view', 'settings:manage',
];

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, uppercase: true },
    displayName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    permissions: [{ type: String, enum: ALL_PERMISSIONS }],
    isSystem: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Role = mongoose.model('Role', roleSchema);
export { ALL_PERMISSIONS };
