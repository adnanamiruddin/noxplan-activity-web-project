import { timingSafeEqual } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

type Result = { valid: boolean; message?: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Result>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ valid: false, message: "Metode tidak diizinkan." });
  }
  const secret = process.env.SECRET_CODE;
  if (!secret) return res.status(500).json({ valid: false, message: "SECRET_CODE belum dikonfigurasi di server." });
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  const a = Buffer.from(code), b = Buffer.from(secret);
  if (a.length === b.length && timingSafeEqual(a, b)) return res.status(200).json({ valid: true });
  await new Promise((r) => setTimeout(r, 600)); // perlambat tebakan beruntun
  return res.status(401).json({ valid: false, message: "Kode rahasia salah. Akses ditolak." });
}
