import { db } from '../config/db.knex.js';
import { sendSMS, sendAdminSMSNotification } from '../config/sms.js';
import { createNotification } from '../modules/notification/notification.service.js';

export const checkLoanInstallmentReminders = async () => {
  try {
    const activeLoans = await db('loans').where({ is_deleted: false, status: 'Active' });
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    let reminderCount = 0;

    for (const loan of activeLoans) {
      const loanAmount = Number(loan.loan_amount || 0);
      const repaidAmount = Number(loan.repaid_amount || 0);
      const remainingDue = loanAmount - repaidAmount;
      if (remainingDue <= 0) continue;

      let isAlertNeeded = false;
      let alertReason = '';

      if (loan.due_date) {
        const due = new Date(loan.due_date);
        if (due < now) {
          isAlertNeeded = true;
          alertReason = 'OVERDUE';
        } else if (due <= threeDaysLater) {
          isAlertNeeded = true;
          alertReason = 'UPCOMING (within 3 days)';
        }
      }

      if (isAlertNeeded) {
        reminderCount++;
        const partyLabel = loan.type === 'LOAN_GIVEN' ? 'Borrower' : 'Lender';
        const msg = `[Loan Alert] ${partyLabel}: ${loan.provider_name} — Due Amount: ৳${remainingDue}. Status: ${alertReason}.`;

        console.log(`[Loan Reminder Job] Alert for Loan #${loan.id}: ${msg}`);

        if (loan.phone) {
          await sendSMS(loan.phone, msg);
        }

        await sendAdminSMSNotification(msg);

        try {
          const adminQuery = db('users').where({ is_active: true, is_deleted: false, role_name: 'ADMIN' });
          if (loan.tenant_id) adminQuery.where('tenant_id', loan.tenant_id);
          const admins = await adminQuery.select('id', 'tenant_id');
          for (const admin of admins) {
            await createNotification({
              userId: admin.id,
              title: `Loan Repayment Alert: ${loan.provider_name}`,
              message: msg,
              type: alertReason.includes('OVERDUE') ? 'WARNING' : 'INFO',
              link: '/accounting/loans',
              tenantId: admin.tenant_id || loan.tenant_id || null,
            });
          }
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
  setTimeout(() => {
    checkLoanInstallmentReminders();
  }, 10000);

  setInterval(() => {
    checkLoanInstallmentReminders();
  }, 24 * 60 * 60 * 1000);
};
