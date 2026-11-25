import { useCallback, useState } from "react";

/** State yang disimpan di localStorage (per browser). Hanya dipakai di komponen yang dirender setelah hydrate. */
export function useStored<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });
  const set = useCallback((next: T) => {
    setValue(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* penyimpanan penuh atau diblokir: pilihan tetap berlaku sampai halaman ditutup */ }
  }, [key]);
  return [value, set];
}
