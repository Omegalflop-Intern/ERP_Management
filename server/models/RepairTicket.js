import mongoose from 'mongoose';

const repairTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deviceModel: { type: String, required: true },
    imeiOrSerial: { type: String },
    issueDescription: { type: String, required: true },
    estimatedCost: { type: Number, required: true },
    advancePaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['RECEIVED', 'INSPECTING', 'AWAITING_PARTS', 'REPAIRED', 'DELIVERED', 'CANCELLED'],
      default: 'RECEIVED'
    },
    technicianName: { type: String },
    partsUsed: [
      {
        partName: { type: String },
        cost: { type: Number }
      }
    ],
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const RepairTicket = mongoose.model('RepairTicket', repairTicketSchema);
