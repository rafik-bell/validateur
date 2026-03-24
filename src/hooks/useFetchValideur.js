import { Valideur } from "../database/validuer";
import Config from "../config/config";

const valideurModel = new Valideur();

export const fetchValideur = async (signature: string) => {

  try {

    const response = await fetch(`${Config.API_URL}/api/val_valideurs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        signature: signature
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    console.log("Valideur:", data);

    if (!data.length) return null;

    const v = data[0];

    const existing = await valideurModel.findBySignature(signature);

    const lastCheck = v.last_check
      ? new Date(v.last_check).getTime()
      : Date.now();

    if (!existing) {

      await valideurModel.insert({
        name: v.name,
        signature: signature,
        operator_id: v.operator,
        status: v.status,
        last_check: lastCheck
      });

    } else {

      await valideurModel.update(existing.id, {
        name: v.name,
        operator_id: v.operator,
        status: v.status,
        last_check: lastCheck
      });

    }

    return ;

  } catch (err) {

    return null;

  }

};