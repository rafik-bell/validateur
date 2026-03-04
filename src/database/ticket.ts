// src/database/ticket.ts
import { BaseModel } from './orm';

export type TicketType = {
  ticket_num?: number;
  status: boolean;
};

export class Ticket extends BaseModel {
  constructor() {
    super('ticket');

    this.createTable(`
      CREATE TABLE IF NOT EXISTS ticket (
        ticket_num INTEGER PRIMARY KEY AUTOINCREMENT,
        status INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  // تحويل boolean تلقائي عند الإضافة
  insert(ticket: TicketType) {
    return super.insert({
      status: ticket.status ? 1 : 0,
    });
  }

  // تحويل بيانات من قاعدة البيانات من INTEGER → boolean
  async all(): Promise<TicketType[]> {
    const rows = await super.all();
    return rows.map((r) => ({
      ticket_num: r.ticket_num,
      status: !!r.status,
    }));
  }
}