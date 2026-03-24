import { Alert } from 'react-native';
import { Ticket } from '../database/ticket'; // تأكد من مسار الاستيراد الصحيح

/**
 * التحقق من صلاحية التذكرة
 * @param {object} ticket - كائن التذكرة { id, ticket_num, certif_if, date, status }
 * @returns {string} "1" إذا صالحة، "0" إذا منتهية الصلاحية أو مستخدمة
 */
export const verifyDate = async (ticket) => {
  try {
    if (!ticket || !ticket.date || !ticket.ticket_num) {//Alert.alert('QR Code Detected ✅',JSON.stringify(ticket));
return "0";}

    const ticketModel = new Ticket();
    const ticketsInDB = await ticketModel.findWhere({ ticket_num: ticket.ticket_num });

    if (ticketsInDB.length > 0) {
      const dbTicket = ticketsInDB[0];
      if (dbTicket.status === "expired" || dbTicket.status === "used") {
        return "0";
      }
    }

    const ticketDate = new Date(ticket.date);
    const today = new Date();

    const ticketYMD = ticketDate.toISOString().split('T')[0];
    const todayYMD = today.toISOString().split('T')[0];

    if (ticketYMD >= todayYMD) {
      return "1"; 
    } else {
      return "0";
    }
  } catch (error) {
    console.error('خطأ في verifyDate:', error);
    return "0";
  }
};