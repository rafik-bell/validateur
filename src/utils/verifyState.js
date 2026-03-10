import { Ticket } from '../database/ticket';
import { Alert } from 'react-native';


const ticketModel = new Ticket();

export const verifyState = async (tr) => {
  try {

    Alert.alert(
      'Certificate Valid ✅',
      `Ticket Number: ${tr.ticket_num}`
    );

    // search ticket in local database
    const ticket = await ticketModel.findByNumber(tr.ticket_num);

    // 1️⃣ ticket not found
    if (!ticket) {
      return 0;
    }

    // 2️⃣ ticket exists but status invalid
    if (ticket.status !== 'active') {
      return 0;
    }

    // 3️⃣ ticket valid
    return 1;

  } catch (error) {
    console.error("verifyState error:", error);
    return 0;
  }
};