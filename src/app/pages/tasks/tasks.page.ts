import { Component } from '@angular/core';
import { SQLiteService } from '../../services/sqlite.service';
import { ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tasks',
  templateUrl: 'tasks.page.html',
  styleUrls: ['tasks.page.scss']
})
export class TasksPage {
  tugas: any[] = [];
  matkul: string = '';
  deskripsi: string = '';
  tenggat: string = '';

  constructor(
    private sqliteService: SQLiteService,
    private toastController: ToastController,
    private http: HttpClient
  ) {
    this.loadTugas();
  }

  async loadTugas(): Promise<void> {
    console.log('Loading tasks...');
    this.tugas = await this.sqliteService.getTugas();
    console.log('Loaded tasks:', this.tugas);
  }

  async addTugas(): Promise<void> {
    console.log('Adding Tugas:', this.matkul, this.deskripsi, this.tenggat);
  
    if (this.matkul && this.deskripsi && this.tenggat) {
      await this.sqliteService.addTugas(
        this.matkul.trim(),
        this.deskripsi.trim(),
        this.tenggat.trim()
      );
    
      console.log('Tugas added successfully');
    
      // Load tasks immediately after adding
      await this.loadTugas();
      this.presentToast('Tugas berhasil ditambahkan');
      this.syncTugas();
    } else {
      this.presentToast('Semua field harus diisi');
    }
  }  


  async updateTugasStatus(id: number, completed: number): Promise<void> {
    await this.sqliteService.updateTugasStatus(id, completed);
    await this.loadTugas();
    this.presentToast('Status tugas berhasil diupdate');
  }

  async deleteTugas(id: number): Promise<void> {
    await this.sqliteService.deleteTugas(id);
    await this.loadTugas();
    this.presentToast('Tugas berhasil dihapus');
  }

  async clearTugas(): Promise<void> {
    await this.sqliteService.clearTugas();
    await this.loadTugas();
    this.presentToast('Semua tugas berhasil dihapus');
  }

  async editTugas(id: number): Promise<void> {
    const tugas = this.tugas.find(t => t.id === id);
    const newMatkul = prompt('Edit Nama Mata Kuliah:', tugas?.matkul);
    const newDeskripsi = prompt('Edit Deskripsi:', tugas?.deskripsi);
    const newTenggat = prompt('Edit Tenggat (format: YYYY-MM-DD):', tugas?.tenggat);

    if (newMatkul !== null && newDeskripsi !== null && newTenggat !== null) {
      await this.sqliteService.updateTugas(id, newMatkul, newDeskripsi, newTenggat);
      await this.loadTugas();
    }
  }

  async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    toast.present();
  }

  syncTugas(): void {
    const tugas = this.tugas.map((tugasItem) => ({
      matkul: tugasItem.matkul,
      deskripsi: tugasItem.deskripsi,
      tenggat: tugasItem.tenggat,
      // Add other properties based on your API requirements
    }));
  
    // Kirim setiap tugas ke API (customize the endpoint)
    tugas.forEach(async (tugasItem) => {
      try {
        await this.http.post('http://localhost/apmob/api_app.php', tugasItem).toPromise();
        console.log('Tugas berhasil disinkronisasi');
      } catch (error) {
        console.error('Error syncing tugas:', error);
      }
    });
  }
  
}
