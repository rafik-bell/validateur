import { Ticket } from '../database/ticket';
import Config from '../config/config';

const ticketModel = new Ticket();

export const fetchAndSaveTickets = async () => {
  try {
    const url = `${Config.API_URL}/api/val_tickets`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    console.log("Tickets from server:", data);

    // get all existing tickets once
    const existingTickets = await ticketModel.all();
    console.log("222222222222222222222",data)

    for (let ticket of data) {
      const existing = existingTickets.find(
       (t) =>
            t.ticket_num === ticket.ticket_number &&
            t.generated_by === ticket.generated_by
      );

      // 1️⃣ ticket does not exist -> insert
      if (!existing) {
        await ticketModel.insert({
          ticket_num: ticket.ticket_number,
          status: ticket.status,
          serial_number :ticket.serial_number,
          generated_by :ticket.generated_by,

        });
      }

      // 2️⃣ ticket exists but status changed -> update
      else if (existing.status !== ticket.status || existing.serial_number !== ticket.serial_number) {
        await ticketModel.update(existing.id, {
          status: ticket.status,
          serial_number:ticket.serial_number,
        });
      }
    }

    return data;

  } catch (err) {
    //console.error("Failed to fetch and save tickets:", err);
    return [];
  }
};