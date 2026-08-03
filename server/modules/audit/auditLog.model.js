import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String },
    fullName: { type: String },
    roleName: { type: String },
    phone: { type: String },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    action: { type: String, required: true },
    module: { type: String },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityType: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ module: 1 });

const prohibitDeletion = function (next) {
  const err = new Error('Hard deletion of entries in the AuditLog collection is strictly prohibited.');
  next(err);
};

auditLogSchema.pre('deleteOne', prohibitDeletion);
auditLogSchema.pre('deleteMany', prohibitDeletion);
auditLogSchema.pre('findOneAndDelete', prohibitDeletion);
auditLogSchema.pre('findOneAndRemove', prohibitDeletion);
auditLogSchema.pre('remove', prohibitDeletion);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
