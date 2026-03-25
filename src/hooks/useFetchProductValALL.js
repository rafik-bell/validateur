import Config from '../config/config';
import { ProductValAll } from '../database/ProductValAll';

const productModel = new ProductValAll();

export const getProductsAllow = async (operator_id: string) => {
  try {
    const response = await fetch(`${Config.API_URL}/products_allow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operator_id: operator_id,
      }),
    });

    const result = await response.json();


    // ✅ نحول البيانات إلى array
    const products = result.result || [];

    // ✅ نحذف البيانات القديمة
    const existing = await productModel.all();
    const productIds = existing.map(p => p.product_id);

    const diff1 = productIds.filter(item => !products.includes(String(item)));
    const diff2 = products.filter(item => !productIds.includes(String(item)));

    // for (const item of existing) {
    //   if (item.id) {
    //     await productModel.delete(item.id);
    //   }
    // }

    // ✅ نحفظ البيانات الجديدة
    for (const product_id of diff2) {
      await productModel.insert({
        product_id: String(product_id),
      });
    }


    return products;

  } catch (error) {
    console.error("Error fetching products_allow:", error);
    return [];
  }
};