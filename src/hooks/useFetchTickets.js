import { Ticket } from '../database/ticket';
import Config from '../config/config';

const ticketModel = new Ticket();

export const fetchAndSaveTickets = async () => {
  try {
    const url = `${Config.API_URL}/api/val_tickets`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    //console.log("Tickets from server:", data);

    // get all existing tickets once
    const existingTickets = await ticketModel.all();

    for (let ticket of data) {
      const existing = existingTickets.find(
        t => t.ticket_num === ticket.ticket_number
      );

      // 1️⃣ ticket does not exist -> insert
      if (!existing) {
        await ticketModel.insert({
          ticket_num: ticket.ticket_number,
          status: ticket.status
        });
      }

      // 2️⃣ ticket exists but status changed -> update
      else if (existing.status !== ticket.status) {
        await ticketModel.update(existing.id, {
          status: ticket.status
        });
      }
    }

    return data;

  } catch (err) {
    //console.error("Failed to fetch and save tickets:", err);
    return [];
  }
};