// src/database/transaction.ts
import { BaseModel } from './orm';

export type TransactionType = {
  id?: number;                
  validation_id: string;      
  ticket_num: string;         
  event_id: string;           
  validator_id: string;       
  location: string;          
  timestamp: number;          
  validation_mode: string;    
  result: string; 
  sync :  string;       
};

export class Transaction extends BaseModel {
  constructor() {
    super('transactions');

    this.createTable(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        validation_id TEXT,
        ticket_num TEXT,
        event_id TEXT,
        validator_id TEXT,
        location TEXT,
        timestamp INTEGER,
        validation_mode TEXT,
        result TEXT,
        sync TEXT
      );
    `);

    this.createTable(`
      CREATE INDEX IF NOT EXISTS idx_transaction_ticket
      ON transactions (ticket_num);
    `);
  }

  insert(transaction: TransactionType) {
    return super.insert({
      validation_id: transaction.validation_id,
      ticket_num: transaction.ticket_num,
      event_id: transaction.event_id,
      validator_id: transaction.validator_id,
      location: transaction.location,
      timestamp: transaction.timestamp,
      validation_mode: transaction.validation_mode,
      result: transaction.result,
      sync: transaction.sync,
    });
  }

  async updateSync(id: number, sync: string) {
    return this.update(id, { sync });
  }


  async all(): Promise<TransactionType[]> {
    const rows = await super.all();
    return rows.map((r) => ({
      id: r.id,
      validation_id: r.validation_id,
      ticket_num: r.ticket_num,
      event_id: r.event_id,
      validator_id: r.validator_id,
      location: r.location,
      timestamp: r.timestamp,
      validation_mode: r.validation_mode,
      result: r.result,
      sync: r.sync,
    }));
  }
  
}