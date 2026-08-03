import { Loan } from '../modules/loan/loan.model.js';
import { sendSMS, sendAdminSMSNotification } from '../config/sms.js';
import { createNotification } from '../modules/notification/notification.service.js';

export const checkLoanInstallmentReminders = async () => {
  try {
    const activeLoans = await Loan.find({ isDeleted: false, status: 'Active' });
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    let reminderCount = 0;

    for (const loan of activeLoans) {
      const remainingDue = (loan.loanAmount || 0) - (loan.repaidAmount || 0);
      if (remainingDue <= 0) continue;

      let isAlertNeeded = false;
      let alertReason = '';

      if (loan.dueDate) {
        const due = new Date(loan.dueDate);
        if (due < now) {
          isAlertNeeded = true;
          alertReason = 'OVERDUE';
        } else if (due <= threeDaysLater) {
          isAlertNeeded = true;
          alertReason = 'UPCOMING (within 3 days)';
        }
      }

      // Also check installment schedule items
      if (loan.installmentSchedule && loan.installmentSchedule.length > 0) {
        for (const inst of loan.installmentSchedule) {
          if (inst.status !== 'Paid' && inst.dueDate) {
            const instDue = new Date(inst.dueDate);
            if (instDue < now) {
              inst.status = 'Overdue';
              isAlertNeeded = true;
              alertReason = `Installment #${inst.installmentNo} OVERDUE`;
            } else if (instDue <= threeDaysLater && alertReason !== 'OVERDUE') {
              isAlertNeeded = true;
              alertReason = `Installment #${inst.installmentNo} UPCOMING`;
            }
          }
        }
        await loan.save();
      }

      if (isAlertNeeded) {
        reminderCount++;
        const partyLabel = loan.type === 'LOAN_GIVEN' ? 'Borrower' : 'Lender';
        const msg = `[Loan Alert] ${partyLabel}: ${loan.providerName} — Due Amount: ৳${remainingDue}. Status: ${alertReason}.`;

        console.log(`[Loan Reminder Job] Alert for Loan #${loan._id}: ${msg}`);

        // Send SMS to party if phone exists
        if (loan.phone) {
          await sendSMS(loan.phone, msg);
        }

        // Notify Admins
        await sendAdminSMSNotification(msg);

        // System DB Notification
        try {
          await createNotification({
            title: `Loan Repayment Alert: ${loan.providerName}`,
            message: msg,
            type: alertReason.includes('OVERDUE') ? 'WARNING' : 'INFO',
            link: '/accounting/loans',
            tenantId: loan.tenantId || null,
          });
        } catch (e) {
          // Continue if notification system is soft failing
        }
      }
    }

    return { success: true, processedLoans: activeLoans.length, remindersSent: reminderCount };
  } catch (error) {
    console.error('[Loan Reminder Job Failed]:', error.message);
    return { success: false, error: error.message };
  }
};

export const startLoanReminderJob = () => {
  // Run once on startup (delayed 10s)
  setTimeout(() => {
    checkLoanInstallmentReminders();
  }, 10000);

  // Run every 24 hours (24 * 60 * 60 * 1000 ms)
  setInterval(() => {
    checkLoanInstallmentReminders();
  }, 24 * 60 * 60 * 1000);
};
