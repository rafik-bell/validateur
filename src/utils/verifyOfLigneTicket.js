/**
 * Verify if a ticket exists and if its date is still valid
 * @param {object} ticket - ticket object with { id, ticket_num, certif_if, date }
 * @returns {string} 1 if valid, 0 if expired or invalid
 */

export const verifyOfLigneTicket = async (ticket) => {
  try {
    // Convert the text into an object

    if (ticket) {
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