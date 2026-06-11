import { useState } from 'react';

export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Bir hata oluştu');
      throw e;
    } finally {
      setBusy(false);
    }
  };
  return { busy, err, setErr, run };
}
