import { BaseModel } from './orm';

export type TicketType = {
  id?: number;
  ticket_num: string;
  status?: string;
 
};

export class Ticket extends BaseModel {
  constructor() {
    super('ticket');

    this.createTable(`
      CREATE TABLE IF NOT EXISTS ticket (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_num TEXT ,
        status TEXT
      );
    `);
  }

  insert(ticket: TicketType) {
    return super.insert({
      ticket_num: ticket.ticket_num,
      status: ticket.status
    });
  }

  async all(): Promise<TicketType[]> {
    const rows = await super.all();

    return rows.map((r) => ({
      id: r.id,
      ticket_num: r.ticket_num,
      status: r.status,
    }));
  }

  async findByNumber(ticketNum: string): Promise<TicketType | null> {
  const row = await this.findOne({ ticket_num: ticketNum });

  if (!row) return null;

  return {
    id: row.id,
    ticket_num: row.ticket_num,
    status: row.status
  };
}
  
}