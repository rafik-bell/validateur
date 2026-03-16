import { Ticket } from '../database/ticket';
import { Alert } from 'react-native';
/**
 * Verify if a ticket exists and if its date is still valid
 * @param {object} ticket - ticket object with { id, ticket_num, certif_if, date }
 * @returns {string} 1 if valid, 0 if expired or invalid
 */


const ticketModel = new Ticket();

export const verifyState = async (tr) => {
  try {

    

    // search ticket in local database
    const ticket = await ticketModel.findByNumber(tr.ticket_num);

    // 1️⃣ ticket not found
    if (!ticket) {
      return "0";
    }

    // 2️⃣ ticket exists but status invalid
    if (ticket.status !== 'active') {
      return '0';
    }

    // 3️⃣ ticket valid
    return "1";

  } catch (error) {
    console.error("verifyState error:", error);
    return "0";
  }
};