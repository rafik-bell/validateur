import { Ticket } from '../database/ticket';
import { Alert } from 'react-native';
/**
 * Verify if a ticket exists and if its date is still valid
 * @param {object} ticket - ticket object with { id, ticket_num, certif_if, date }
 * @returns {string} 1 if valid, 0 if expired or invalid
 */


const ticketModel = new Ticket();

export const verifyState = async (tr,source) => {
  try {

    

    // search ticket in local database
    const generated_by = (tr.uuid || tr.device_uuid || "").trim();
    const ticket_num = (tr.ticket_num || "").trim();

    const ticket = await ticketModel.findByNumberAndGeneratedBy(
        ticket_num,
        generated_by
    );
    
    const ticketnum = await ticketModel.findByNumber(ticket_num);



    // 1️⃣ ticket not found
    if (!ticket) {
      if (ticketnum) {
        return "2";
      }
      return "0";
    }


    if (source.scanType === "nfc") {
      if (ticket.serial_number !== source.serial_number) {
      
      return "2";
    }
    }
    if (ticket.status === 'used') {
      return '2';
    }


    // 2️⃣ ticket exists but status invalid
    if (ticket.status !== 'active') {
      return '2';
    }

    // 3️⃣ ticket valid
    return "1";

  } catch (error) {
    console.error("verifyState error:", error);
    return "0";
  }
};