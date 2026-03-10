export const verifyOfLigneTicket = async (ticket) => {
  try {
    // Convert the text into an object

    if (ticket) {
      //Alert.alert(
        //'Certificate Valid ✅',
       // `Ticket Number: ${ticket.ticket_num}\nCertificate ID: ${ticket.certif_if}\nDate: ${ticket.date}`
     // );
      return 1; // certificate is valid
    } else {
      return 0; // certificate is invalid
    }

  } catch (error) {
    console.error('verifyCertificate error:', error);
    return 0; // treat errors as invalid certificate
  }
};