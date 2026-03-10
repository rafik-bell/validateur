import { Alert } from 'react-native';

/**
 * Verify if a ticket exists and if its date is still valid
 * @param {object} ticket - ticket object with { id, ticket_num, certif_if, date }
 * @returns {number} 1 if valid, 0 if expired or invalid
 */
export const verifyDate = (ticket) => {
  try {
    if (!ticket || !ticket.date) return 0;

    const ticketDate = new Date(ticket.date);
    const today = new Date();

    // الحصول على التاريخ فقط بدون الوقت
    const ticketYMD = ticketDate.toISOString().split('T')[0];
    const todayYMD = today.toISOString().split('T')[0];

    if (ticketYMD >= todayYMD) {
      return 1;
    } else {
      return 0;
    }
  } catch (error) {
    console.error('خطأ في verifyDate:', error);
    return 0;
  }
};