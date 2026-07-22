import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    status: { type: String, enum: ['present', 'absent', 'late', 'half-day'], default: 'present' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
