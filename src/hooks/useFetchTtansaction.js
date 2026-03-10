import { Transaction } from '../database/transaction';
import Config from '../config/config';

const transactionModel = new Transaction();

export const fetchAndSaveTransaction = async () => {
  try {
    const url = `${Config.API_URL}/api/val_transaction`;

    // get only unsynced transactions
    const transactions = await transactionModel.findWhere({ sync: '0' });

    if (transactions.length === 0) {
      console.log('No transactions to sync.');
      return;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactions),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await transactionModel.updateWhere({ sync: '0' }, { sync: '1' });

    console.log('Transactions synced successfully.');
  } catch (error) {
    console.error('Error syncing transactions:', error);
    throw error;
  }
};