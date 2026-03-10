// src/database/orm.ts
import { db } from './database';

export class BaseModel {
  tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  createTable(sql: string) {
    db.transaction((tx) => {
      tx.executeSql(sql);
    });
  }

  insert(data: Record<string, any>): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const sql = `INSERT INTO ${this.tableName} (${keys.join(
      ', '
    )}) VALUES (${placeholders})`;

    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          sql,
          values,
          (_, result) => resolve(result.insertId),
          (_, err) => {
            reject(err);
            return false;
          }
        );
      });
    });
  }

  all(): Promise<any[]> {
    const sql = `SELECT * FROM ${this.tableName}`;
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          sql,
          [],
          (_, result) => {
            const rows = [];
            for (let i = 0; i < result.rows.length; i++) {
              rows.push(result.rows.item(i));
            }
            resolve(rows);
          },
          (_, err) => {
            reject(err);
            return false;
          }
        );
      });
    });
  }

  findById(id: number): Promise<any | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          sql,
          [id],
          (_, result) => {
            if (result.rows.length > 0) resolve(result.rows.item(0));
            else resolve(null);
          },
          (_, err) => {
            reject(err);
            return false;
          }
        );
      });
    });
  }

  update(id: number, data: Record<string, any>): Promise<void> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setString = keys.map((k) => `${k} = ?`).join(', ');

    const sql = `UPDATE ${this.tableName} SET ${setString} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          sql,
          [...values, id],
          () => resolve(),
          (_, err) => {
            reject(err);
            return false;
          }
        );
      });
    });
  }

  delete(id: number): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          sql,
          [id],
          () => resolve(),
          (_, err) => {
            reject(err);
            return false;
          }
        );
      });
    });
  }

  findOne(where: Record<string, any>): Promise<any | null> {
  const keys = Object.keys(where);
  const values = Object.values(where);

  const condition = keys.map((k) => `${k} = ?`).join(' AND ');
  const sql = `SELECT * FROM ${this.tableName} WHERE ${condition} LIMIT 1`;

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        values,
        (_, result) => {
          if (result.rows.length > 0) {
            resolve(result.rows.item(0));
          } else {
            resolve(null);
          }
        },
        (_, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}


updateWhere(where: Record<string, any>, data: Record<string, any>): Promise<void> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setString = keys.map((k) => `${k} = ?`).join(', ');

  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);

  let sql = `UPDATE ${this.tableName} SET ${setString}`;

  if (whereKeys.length > 0) {
    const whereString = whereKeys.map((k) => `${k} = ?`).join(' AND ');
    sql += ` WHERE ${whereString}`;
  }

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        [...values, ...whereValues],
        () => resolve(),
        (_, err) => {
          console.error("SQL Update Error:", err);
          reject(err);
          return false;
        }
      );
    });
  });
}

async findWhere(where: Record<string, any>): Promise<any[]> {
  const keys = Object.keys(where);
  const values = Object.values(where);

  const condition = keys.map((k) => `${k} = ?`).join(' AND ');
  const sql = `SELECT * FROM ${this.tableName} WHERE ${condition}`;

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        values,
        (_, result) => {
          const rows = [];
          for (let i = 0; i < result.rows.length; i++) {
            rows.push(result.rows.item(i));
          }
          resolve(rows);
        },
        (_, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}
}