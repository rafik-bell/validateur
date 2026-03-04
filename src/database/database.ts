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
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS ticket (
        ticket_num INTEGER PRIMARY KEY AUTOINCREMENT,
        status INTEGER NOT NULL DEFAULT 0
      );
    `);
  });
};