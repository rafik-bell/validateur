/**
 * Verify if a ticket exists and if its date is still valid
 * @param {object} ticket - ticket object with { id, ticket_num, certif_if, date }
 * @returns {string} 1 if valid, 0 if expired or invalid
 */

import { Transaction } from "../database/transaction";
import AsyncStorage from '@react-native-async-storage/async-storage';


const transactionModel = new Transaction();


export const verifyOfLigneTicket = async (ticket) => {
  try {
    // Convert the text into an object

    if (ticket) {

      const MAX_USES_OFFLINE = await AsyncStorage.getItem("MAX_USES_OFFLINE");
      
      const transactions = await transactionModel.getLast(Number(MAX_USES_OFFLINE));


      console.log("last transaction",transactions)
      console.log("MAX_USES_OFFLINE",MAX_USES_OFFLINE)


      if (MAX_USES_OFFLINE !== null && MAX_USES_OFFLINE !== "0" && transactions.length === Number(MAX_USES_OFFLINE) && transactions[0].sync === "0") {
      return "0";
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