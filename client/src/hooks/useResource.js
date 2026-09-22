import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
export default function useResource(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((v) => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api
      .get(path, { signal: controller.signal })
      .then((r) => setData(r.data))
      .catch((e) => {
        if (e.code !== 'ERR_CANCELED') setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, revision]);
  return { data, error, loading, reload };
}
