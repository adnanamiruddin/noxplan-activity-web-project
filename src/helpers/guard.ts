import Swal from "sweetalert2";

let unlocked = false; // terbuka selama tab ini belum di-refresh

/** Minta kode rahasia (dicocokkan di server). @returns true bila benar; false bila dibatalkan */
export async function requestSecretAccess(action: string): Promise<boolean> {
  if (unlocked) return true;
  const r = await Swal.fire({
    icon: "warning",
    title: "Akses terbatas",
    text: `Aksi "${action}" mengubah master data. Masukkan kode rahasia untuk melanjutkan.`,
    input: "password",
    inputPlaceholder: "Kode rahasia",
    inputAttributes: { autocomplete: "off", autocapitalize: "off", "aria-label": "Kode rahasia" },
    showCancelButton: true,
    confirmButtonText: "Verifikasi",
    cancelButtonText: "Batal",
    reverseButtons: true,
    buttonsStyling: false,
    customClass: { confirmButton: "btn btn-primary", cancelButton: "btn btn-ghost", actions: "gap-2" },
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !Swal.isLoading(),
    inputValidator: (v: string) => (v.trim() ? null : "Kode rahasia wajib diisi."),
    preConfirm: async (code: string) => {
      try {
        const res = await fetch("/api/verify-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
        const j = (await res.json().catch(() => ({}))) as { valid?: boolean; message?: string };
        if (!res.ok || !j.valid) { Swal.showValidationMessage(j.message || "Kode rahasia salah. Akses ditolak."); return false; }
        return true;
      } catch {
        Swal.showValidationMessage("Gagal menghubungi server.");
        return false;
      }
    },
  });
  if (r.isConfirmed) unlocked = true;
  return r.isConfirmed;
}
