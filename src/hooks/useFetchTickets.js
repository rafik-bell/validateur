import { Ticket } from '../database/ticket';
import Config from '../config/config';

const ticketModel = new Ticket();

/**
 * Normalize all values to avoid:
 * false vs "" vs "0" vs null vs undefined issues
 */
const normalize = (v) => {
  if (v === false || v === null || v === undefined) return "";
  return String(v).trim();
};

const toNumber = (v) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

export const fetchAndSaveTickets = async () => {
  try {
    const url = `${Config.API_URL}/api/val_tickets`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("Tickets from server:", data);

    const existingTickets = await ticketModel.all();

    for (let ticket of data) {

      // 1️⃣ FIND existing ticket (unique key)
      const existing = existingTickets.find(
        (t) =>
          normalize(t.ticket_num) === normalize(ticket.ticket_number) &&
          normalize(t.generated_by) === normalize(ticket.generated_by)
      );


      // 2️⃣ INSERT if not exists
      if (!existing) {
        await ticketModel.insert({
          ticket_num: ticket.ticket_number,
          status: normalize(ticket.status),
          serial_number: normalize(ticket.serial_number),
          generated_by: normalize(ticket.generated_by),
          max_uses: toNumber(ticket.max_uses),
          remaining_uses: toNumber(ticket.remaining_uses),
        });

        continue;
      }

      // 3️⃣ UPDATE if exists
      const needUpdate =
        normalize(existing.status) !== normalize(ticket.status) ||
        normalize(existing.serial_number) !== normalize(ticket.serial_number) ||
        normalize(existing.generated_by) !== normalize(ticket.generated_by) ||
        toNumber(existing.remaining_uses) !== toNumber(ticket.remaining_uses) ||
        toNumber(existing.max_uses) !== toNumber(ticket.max_uses);

      if (needUpdate) {
        await ticketModel.update(existing.id, {
          status: normalize(ticket.status),
          serial_number: normalize(ticket.serial_number),
          generated_by: normalize(ticket.generated_by),
          remaining_uses: toNumber(ticket.remaining_uses),
          max_uses: toNumber(ticket.max_uses),
        });
      }
    }

    return data;

  } catch (err) {
    //console.error("Failed to fetch and save tickets:", err);
    return [];
  }
};