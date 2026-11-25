import Swal from "sweetalert2";

const Toast = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 3000, timerProgressBar: true });

/** Toast SweetAlert2; dirender di dalam <dialog> yang terbuka agar tidak tertutup top layer */
export function notify(title: string, icon: "success" | "error" | "info" = "success"): void {
  if (typeof document === "undefined") return;
  void Toast.fire({ icon, title, target: document.querySelector<HTMLElement>("dialog[open]") || "body" });
}

const dialogTarget = () => (typeof document !== "undefined" && document.querySelector<HTMLElement>("dialog[open]")) || "body";

/** Dialog konfirmasi sebelum status selesai dibatalkan (tanggal selesai ikut terhapus) */
export const confirmReopen = (task: string, doneOn: string) =>
  Swal.fire({
    title: "Batalkan status selesai?", text: doneOn ? `"${task}" selesai pada ${doneOn}. Tanggal selesai akan dihapus.` : `"${task}" akan dikembalikan ke belum selesai.`, icon: "question",
    showCancelButton: true, confirmButtonText: "Batalkan selesai", cancelButtonText: "Tetap selesai", reverseButtons: true,
    buttonsStyling: false, customClass: { confirmButton: "btn btn-warning", cancelButton: "btn btn-ghost", actions: "gap-2" },
    target: dialogTarget(),
  });

/** Dialog konfirmasi hapus */
export const confirmDelete = (title: string, text?: string) =>
  Swal.fire({
    title, text, icon: "warning", showCancelButton: true, confirmButtonText: "Hapus", cancelButtonText: "Batal", reverseButtons: true,
    buttonsStyling: false, customClass: { confirmButton: "btn btn-error", cancelButton: "btn btn-ghost", actions: "gap-2" },
    target: dialogTarget(),
  });
