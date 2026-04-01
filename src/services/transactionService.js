// src/services/transactionService.js

import { Transaction } from '../database/transaction';
import { Valideur } from '../database/validuer';
import { getItem } from './storageService';

const transactionModel = new Transaction();
const valideurModel = new Valideur();

export const addTransaction = async (
  ticket,
  result = '',
  mode,
  setTicketStatus,
  setStatusColor,
  setScanned
) => {
  try {
        if (result === 'success') {

    const transactions = await transactionModel.findWhere({
      ticket_num: ticket.ticket_num
    });

    // ✅ check last transaction
    if (transactions.length > 0) {
      const lastTransaction = transactions.reduce((prev, current) => {
        return prev.timestamp > current.timestamp ? prev : current;
      });

      const now = Date.now();
      const diff = now - lastTransaction.timestamp;

      const tenMinutes = 30 * 1000;

      if (diff < tenMinutes) {
        setTicketStatus?.('wait');
        setStatusColor?.('yellow');

        setTimeout(() => {
          setScanned?.(false);
          setTicketStatus?.(null);
          setStatusColor?.('transparent');
        }, 3000);

        return "0";
      }
    }
  }

    const valideur = await valideurModel.all();
          const id = await getItem('SELECTED_TRANSPORT_ID');
          const uuid = await getItem('DEVICE_UUID');

          console.log("<<<<<<<<<<<<",id,uuid)
    

    await transactionModel.insert({
      validation_id: `val_${Date.now()}`,
      ticket_num: ticket.ticket_num,
      event_id: `EVT_${Date.now()}`,
      validator_id: uuid || "unknown",
      location: `Gate_${uuid}`,
      timestamp: Date.now(),
      validation_mode: mode,
      result,
      sync: '0'
    });

    return "1";

  } catch (err) {
    console.error('Transaction insert failed:', err);
    return "0";
  }
};