import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="font-display text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-2 text-xl font-bold">Halaman tidak ditemukan</h1>
      <Link href="/" className="btn btn-primary mt-6">Ke Beranda</Link>
    </div>
  );
}
