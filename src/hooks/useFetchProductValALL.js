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

    console.log("API result:", result.result);

    // ✅ نحول البيانات إلى array
    const products = result.result || [];

    // ✅ نحذف البيانات القديمة
    const existing = await productModel.all();
    for (const item of existing) {
      if (item.id) {
        await productModel.delete(item.id);
      }
    }

    // ✅ نحفظ البيانات الجديدة
    for (const product_id of products) {
      await productModel.insert({
        product_id: String(product_id),
      });
    }
        const products33 = await productModel.all();

        console.log("products field:",products33);
    // ✅ نرجع array
    return products;

  } catch (error) {
    console.error("Error fetching products_allow:", error);
    return [];
  }
};