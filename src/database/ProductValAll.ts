import { BaseModel } from "./orm";

export type ProductValAllType = {
  id?: number;
  product_id: string;
};

export class ProductValAll extends BaseModel {
  constructor() {
    super("productvalall");

    this.createTable(`
      CREATE TABLE IF NOT EXISTS productvalall (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT
      );
    `);
  }

  // ✅ إضافة (Insert)
  insert(data: ProductValAllType) {
    return super.insert({
      product_id: data.product_id,
    });
  }

  // ✅ تحديث حسب id
  update(id: number, data: Partial<ProductValAllType>) {
    return super.update(id, data);
  }

  // ✅ حذف حسب id
  delete(id: number) {
    return super.delete(id);
  }

  // ✅ جلب كل البيانات
  async all(): Promise<ProductValAllType[]> {
    return await super.all();
  }

  // ✅ جلب عنصر حسب id
  async getById(id: number): Promise<ProductValAllType | null> {
    return await super.findById(id);
  }

  // ✅ البحث حسب product_id
  async findByProductId(product_id: string) {
    return await super.findOne({ product_id });
  }

  // ✅ البحث بشرط معين
  async findBy(where: Record<string, any>) {
    return await super.findWhere(where);
  }

  // ✅ تحديث حسب شرط
  async updateBy(where: Record<string, any>, data: Record<string, any>) {
    return await super.updateWhere(where, data);
  }
}