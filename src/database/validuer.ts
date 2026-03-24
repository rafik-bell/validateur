import { BaseModel } from "./orm";

export type ValideurType = {
  id?: number;
  name: string;
  signature?: string;
  last_check?: number;
  operator_id?: string;
  status?: string;
};

export class Valideur extends BaseModel {

  constructor() {
    super("valideur");

    this.createTable(`
      CREATE TABLE IF NOT EXISTS valideur (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        signature TEXT,
        last_check INTEGER,
        operator_id TEXT,
        status TEXT
      );
    `);
  }

  insert(valideur: ValideurType) {
    return super.insert({
      name: valideur.name,
      signature: valideur.signature,
      last_check: valideur.last_check,
      operator_id: valideur.operator_id,
      status: valideur.status
    });
  }

  async all(): Promise<ValideurType[]> {
    const rows = await super.all();
    console.log('All valisdeurs:', rows);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      signature: r.signature,
      last_check: r.last_check,
      operator_id: r.operator_id,
      status: r.status
    }));
  }

  async findBySignature(signature: string): Promise<ValideurType | null> {
    const row = await this.findOne({ signature });

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      signature: row.signature,
      last_check: row.last_check,
      operator_id: row.operator_id,
      status: row.status
    };
  }

  async updateLastCheck(id: number) {
    return super.update(id, {
      last_check: Date.now()
    });
  }

}