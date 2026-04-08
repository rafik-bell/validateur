import { BaseModel } from './orm';

export type TicketType = {
  id?: number;
  ticket_num: string;
  status?: string;
  serial_number?: string;
  generated_by?: string;
  max_uses?: number;
  remaining_uses?: number;

 
};

export class Ticket extends BaseModel {
  constructor() {
    super('ticket');

    this.createTable(`
      CREATE TABLE IF NOT EXISTS ticket (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_num TEXT ,
        status TEXT,
        serial_number TEXT,
        generated_by TEXT,
        max_uses INTEGER,
        remaining_uses INTEGER
      );
    `);
  }

  insert(ticket: TicketType) {
    return super.insert({
      ticket_num: ticket.ticket_num,
      status: ticket.status,
      serial_number : ticket.serial_number,
      generated_by : ticket.generated_by,
      max_uses : ticket.max_uses,
      remaining_uses : ticket.remaining_uses
    });
  }

  async all(): Promise<TicketType[]> {
    const rows = await super.all();

    return rows.map((r) => ({
      id: r.id,
      ticket_num: r.ticket_num,
      status: r.status,
      serial_number : r.serial_number,
      generated_by : r.generated_by,
      max_uses : r.max_uses,
      remaining_uses : r.remaining_uses

    }));
  }

  async findByNumber(ticketNum: string): Promise<TicketType | null> {
  const row = await this.findOne({ ticket_num: ticketNum });

  if (!row) return null;

  return {
    id: row.id,
    ticket_num: row.ticket_num,
    status: row.status,
    serial_number : row.serial_number,
    generated_by : row.generated_by,
    max_uses : row.max_uses,
    remaining_uses : row.remaining_uses

  };
}
async findByNumberAndGeneratedBy(
  ticketNum: string,
  generatedBy: string
): Promise<TicketType | null> {

  const row = await this.findOne({
    ticket_num: ticketNum,
    generated_by: generatedBy
  });

  if (!row) return null;

  return {
    id: row.id,
    ticket_num: row.ticket_num,
    status: row.status,
    serial_number: row.serial_number,
    generated_by: row.generated_by,
    max_uses : row.max_uses,
    remaining_uses : row.remaining_uses
  };
}
  
}