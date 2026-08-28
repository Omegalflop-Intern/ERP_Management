/**
 * Auto Checkout Job
 * -----------------
 * Runs every minute. Finds all attendance records where:
 *  - check_in exists but check_out is null
 *  - The current time has passed the employee's shift_end (default: 22:00)
 *    OR the attendance date is from a previous day (employee forgot and it's a new day)
 *
 * Auto-checks out with a note: "Auto-checked out at shift end"
 * Status is set to "auto_checkout"
 */

import cron from 'node-cron';
import { db } from '../config/db.knex.js';

export const startAutoCheckoutJob = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const currentTimeStr = now.toTimeString().slice(0, 8); // HH:MM:SS

      // Find all open attendance records (checked in, not checked out)
      const openAttendances = await db('attendances as a')
        .leftJoin('employees as e', 'a.employee_id', 'e.id')
        .where('a.is_deleted', false)
        .whereNotNull('a.check_in')
        .whereNull('a.check_out')
        .select(
          'a.id as attendance_id',
          'a.date as att_date',
          'a.check_in',
          'a.tenant_id',
          'a.branch_id',
          'a.employee_id',
          'e.name as emp_name',
          db.raw("COALESCE(e.shift_end, '22:00:00') as shift_end"),
        );

      for (const att of openAttendances) {
        const attDate = String(att.att_date).slice(0, 10);
        const shiftEnd = att.shift_end || '22:00:00'; // e.g. "22:00:00"

        let shouldAutoCheckout = false;
        let checkoutTime = null;
        let reason = '';

        if (attDate < todayStr) {
          // Attendance is from a previous day — auto-checkout at shift end of that day
          shouldAutoCheckout = true;
          // Set checkout at end of shift on that date
          checkoutTime = new Date(`${attDate}T${shiftEnd}`);
          reason = `Auto-checked out — missed checkout on ${attDate}`;
        } else if (attDate === todayStr && currentTimeStr >= shiftEnd) {
          // Today's attendance — shift end time has been reached/passed
          shouldAutoCheckout = true;
          checkoutTime = new Date(`${todayStr}T${shiftEnd}`);
          reason = `Auto-checked out at shift end (${shiftEnd.slice(0, 5)})`;
        }

        if (shouldAutoCheckout) {
          await db('attendances')
            .where({ id: att.attendance_id })
            .update({
              check_out: checkoutTime,
              status: 'auto_checkout',
              notes: db.raw(
                `CASE WHEN notes IS NULL OR notes = '' THEN ? ELSE CONCAT(notes, ' | ', ?) END`,
                [reason, reason],
              ),
            });

          console.log(
            `[AUTO-CHECKOUT] Employee #${att.employee_id} (${att.emp_name || 'Unknown'}) — attendance ${att.attendance_id} — ${reason}`,
          );
        }
      }
    } catch (err) {
      console.error('[CRON] Auto-checkout job failed:', err.message);
    }
  });

  console.log('[CRON] ✅ Auto-checkout job started (runs every minute, checks shift end times)');
};
