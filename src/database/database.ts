import SQLite from 'react-native-sqlite-2';

export const db = SQLite.openDatabase(
  'app.db',
  '1.0',
  'App Database',
  1
);

// Initialize tables
export const initDB = () => {
  db.transaction((tx) => {
    // Ticket table
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS ticket (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_num TEXT,
        status TEXT,
        serial_number TEXT

      );
    `);

    tx.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_ticket_num
      ON ticket (ticket_num);
    `);

    // Transaction table
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        validation_id TEXT,
        ticket_num TEXT,
        event_id TEXT,
        validator_id TEXT,
        location TEXT,
        timestamp INTEGER,
        validation_mode TEXT,
        result TEXT,
        sync TEXT
      );
    `);

    tx.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_transaction_ticket
      ON transactions (ticket_num);
    `);


    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS valideur (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        signature TEXT,
        last_check INTEGER,
        operator_id TEXT,
        status TEXT
      );
    `);
    // --- Device table ---
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS device (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT,
        status TEXT,
        timestamp INTEGER,


      );
    `);

     // --- جدول certification ---
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS certification (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        line_code TEXT,
        private_key TEXT
      );
    `);

    // --- جدول identification ---
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS identification (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT,
        status TEXT
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS productvalall (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT,
      );
    `);
  });
};



