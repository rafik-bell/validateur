import { Alert } from 'react-native';

import { ProductValAll } from '../database/ProductValAll';

const productModel = new ProductValAll();
/**
 * Verify if a ticket exists and if its date is still valid
 * @param {object} ticket - ticket object with { id, ticket_num, certif_if, date }
 * @returns {string} 1 if valid, 0 if expired or invalid
 */

export const verifyCertificate = async (ticket) => {
  try {
    // Convert the text into an object

    const products33 = await productModel.all();
    const productIds = products33.map(p => p.product_id);



    if (ticket) {
      if (productIds.includes(ticket.certif_id)) {
            console.log("Certificate Valid ✅");
        } else {
          console.log("Certificate 333333 ✅",ticket.certif_id);
            return "0";
             // only valid inside a function
        }
      //Alert.alert(
        //'Certificate Valid ✅',
       // `Ticket Number: ${ticket.ticket_num}\nCertificate ID: ${ticket.certif_if}\nDate: ${ticket.date}`
     // );
      return "1"; // certificate is valid
    } else {
      return "0"; // certificate is invalid
    }

  } catch (error) {
    console.error('verifyCertificate error:', error);
    return "0"; // treat errors as invalid certificate
  }
};