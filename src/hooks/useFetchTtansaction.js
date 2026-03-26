import { Transaction } from '../database/transaction';
import { Valideur } from '../database/validuer';
import Config from '../config/config';

const transactionModel = new Transaction();
const valideurModel = new Valideur();

export const fetchAndSaveTransaction = async () => {
  try {
    const url = `${Config.API_URL}/api/val_transaction`;

    // Get only unsynced transactions
    const transactions = await transactionModel.findWhere({ sync: '0' });
    const valideurs = await valideurModel.all();


    if (transactions.length === 0) {
      //console.log('No transactions to sync.');
      return;
    }

    // Send both transactions and valideurs in a single object
    const payload = {
      transactions,
      valideurs
    };
    

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await transactionModel.updateWhere({ sync: '0' }, { sync: '1' });

    //console.log('Transactions synced successfully.');
  } catch (error) {
    //console.error('Error syncing transactions:', error);
    // throw error;
  }
};