import { BaseModel } from "./orm";

export type IdentificationType = {
  id?: number;
  uuid: string;
  status: string; // أو number إذا حبيت
};

export class Identification extends BaseModel {

  constructor() {
    super("identification");

    this.createTable(`
      CREATE TABLE IF NOT EXISTS identification (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT,
        status TEXT
      );
    `);
  }

  insert(data: IdentificationType) {
    return super.insert({
      uuid: data.uuid,
      status: data.status
    });
  }

  async all(): Promise<IdentificationType[]> {
    const rows = await super.all();
    console.log('All identifications:', rows);

    return rows.map((r) => ({
      id: r.id,
      uuid: r.uuid,
      status: r.status
    }));
  }

   updateById(id: number, data: Partial<IdentificationType>): Promise<void> {
  // فقط الحقول الموجودة سيتم تحديثها
  const updateData: Record<string, any> = {};
  if (data.uuid !== undefined) updateData.uuid = data.uuid;
  if (data.status !== undefined) updateData.status = data.status;

  return super.update(id, updateData); // استدعاء دالة update من BaseModel
}

}