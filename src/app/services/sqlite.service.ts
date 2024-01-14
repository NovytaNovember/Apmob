import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CapacitorSQLite, capConnectionOptions } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root',
})
export class SQLiteService {
  db = CapacitorSQLite;
  private apiUrl = 'http://192.168.100.14/apmob/api_app.php';

  constructor(private http: HttpClient) {
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    const dbOptions: capConnectionOptions = {
      database: 'tugaskuliah_db',
      encrypted: false,
      mode: 'no-encryption',
      readonly: false,
    };

    // Use this.db as a reference to CapacitorSQLite for executing queries
    this.db = CapacitorSQLite;
    this.db.createConnection(dbOptions);
    this.db.open({ database: 'tugaskuliah_db', readonly: false });

    await this.createTable();
  }

  private async createTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS tugas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        matkul TEXT NOT NULL,
        deskripsi TEXT NOT NULL,
        tenggat DATE,
        completed INTEGER DEFAULT 0
      )`;

    // Use CapacitorSQLite for running queries
    await this.db.run({ database: 'tugaskuliah_db', statement: query, values: [] });
  }

  async addTugas(matkul: string, deskripsi?: string, tenggat?: string): Promise<void> {
    const query = 'INSERT INTO tugas (matkul, deskripsi, tenggat) VALUES (?, ?, ?)';
    await this.db.run({ database: 'tugaskuliah_db', statement: query, values: [matkul, deskripsi, tenggat] });
    await this.syncTugas(); // Sync with the remote API
  }

  async getTugas(): Promise<any[]> {
    const query = 'SELECT * FROM tugas';
    const result = await this.db.query({ database: 'tugaskuliah_db', statement: query, values: [] });
    return result?.values || [];
  }

  async updateTugasStatus(id: number, completed: number): Promise<void> {
    const query = 'UPDATE tugas SET completed = ? WHERE id = ?';
    await this.db.run({ database: 'tugaskuliah_db', statement: query, values: [completed, id] });
    await this.syncTugas(); // Sync with the remote API
  }

  async deleteTugas(id: number): Promise<void> {
    const query = 'DELETE FROM tugas WHERE id = ?';
    await this.db.run({ database: 'tugaskuliah_db', statement: query, values: [id] });
    await this.syncTugas(); // Sync with the remote API
  }

  async clearTugas(): Promise<void> {
    const query = 'DELETE FROM tugas';
    await this.db.run({ database: 'tugaskuliah_db', statement: query, values: [] });
    await this.syncTugas(); // Sync with the remote API
  }

  async updateTugas(id: number, matkul: string, deskripsi: string, tenggat: string): Promise<void> {
    const query = 'UPDATE tugas SET matkul = ?, deskripsi = ?, tenggat = ? WHERE id = ?';
    await this.db.run({ database: 'tugaskuliah_db', statement: query, values: [matkul, deskripsi, tenggat, id] });
    await this.syncTugas(); // Sync with the remote API
  }

  private async syncTugas(): Promise<void> {
    const tugas = await this.getTugas(); // Get all local tugas

    // Send each tugas to the API
    for (const tugasItem of tugas) {
      const payload = {
        matkul: tugasItem.matkul,
        deskripsi: tugasItem.deskripsi,
        tenggat: tugasItem.tenggat,
      };

      this.http.post(this.apiUrl, payload).subscribe(
        () => {
          // Handle success, e.g., mark the tugas as synced
          console.log('Tugas synced successfully');
        },
        (error) => {
          console.error('Error syncing tugas:', error);
        }
      );
    }
  }
}
