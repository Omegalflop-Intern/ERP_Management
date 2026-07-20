import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String },
    fullName: { type: String },
    roleName: { type: String },
    phone: { type: String },
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

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
