# NoxPlan Activity

Aplikasi pembuat activity plan (DMAIC) berbasis web. Data tersimpan di localStorage browser, tanpa login.

## Stack
Next.js (Pages Router) + TypeScript, Tailwind CSS v4 + DaisyUI v5, react-icons, SweetAlert2, NProgress, Chart.js, write-excel-file / read-excel-file.

## Menjalankan
```bash
npm install
npm run dev        # http://localhost:3000
# produksi
npm run build && npm start
```

## Env
`SECRET_CODE` dipakai untuk membuka halaman Master Data dan Master Fase. Lokal: isi di `.env.local`. Deploy (mis. Vercel): tambahkan `SECRET_CODE` di Environment Variables, karena `.env.local` tidak ikut ter-deploy. Jangan di-commit ke repo publik.

Kode ini hanya mencegah master data terubah tanpa sengaja. Data tetap di localStorage browser masing-masing, jadi bukan pengaman data.

## Fitur
- Sidebar kiri: Menu utama (Beranda, Aktivitas, Timeline, Progres, Plan) dan Master (Master Fase, Master Key Deliverable)
- Banyak plan, pindah plan lewat pemilih plan di sidebar
- Buat plan dari Excel: unggah file, plan langsung jadi
- Aktivitas: Upload Excel (tambah massal ke plan aktif), Template Excel, Ekspor plan; aktivitas baru bertanda NEW sampai halaman di-refresh
- Template Excel dengan header `FASE | KEY DELIVERABLES | DESKRIPSI | RENCANA MULAI | RENCANA SELESAI`
- Aktivitas: daftar dan board (drag and drop), filter, hapus massal
- Timeline dinamis: pilih fase yang ditampilkan (tombol Mode DMAIC langsung memilih fase DMAIC saja) dan atur per fase apakah rinciannya per key deliverable atau dirangkum jadi satu baris (menu Rincian deliverable); pilihan tersimpan di browser
- Timeline ala Excel: minggu mengikuti kalender, Week n = hari Rabu ke-n di bulan itu (sebulan 4 atau 5 minggu, sama dengan timeline OJT 1); minggu di luar rentang plan berwarna abu-abu; Daily Task tidak ikut secara default; unduh PNG atau Excel sesuai tampilan
- Efek konfeti saat aktivitas diselesaikan; tanggal selesai otomatis hari itu, bisa diubah dengan klik tanggalnya (tidak boleh di masa depan); membatalkan status selesai harus dikonfirmasi
- Progres: kurva S, status, per fase
- Skor Planning, Drive, Action beserta saran

## Aturan impor Excel
- Kolom FASE dan KEY DELIVERABLES harus sama dengan yang ada di Master (dropdown tersedia di template)
- Tanggal wajib terisi, selesai tidak boleh sebelum mulai, maksimal 500 baris
- Baris yang tidak valid dilewati dan dilaporkan, baris valid tetap masuk
