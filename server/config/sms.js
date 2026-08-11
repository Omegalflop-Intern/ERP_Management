/**
 * SMS Gateway Config & Utility
 * Note: SMS Service has been disabled / removed per application requirements.
 */

export const sendSMS = async () => {
  return { success: false, disabled: true, reason: 'SMS service is disabled' };
};

export const sendAdminSMSNotification = async () => {
  return { success: false, disabled: true, reason: 'SMS service is disabled' };
};

export const sendCustomerInvoiceSMS = async () => {
  return { success: false, disabled: true, reason: 'SMS service is disabled' };
};

export const sendCustomerRepairSMS = async () => {
  return { success: false, disabled: true, reason: 'SMS service is disabled' };
};
