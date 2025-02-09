import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../contexts/AuthContext";

/**
 * @template T
 * @typedef {object} ReturnValues
 * @property {T | null} data
 * @property {Error | null} error
 * @property {boolean} loading
 * @property {() => void} revalidate
 */

/**
 * @template T
 * @param {string} apiPath
 * @param {(apiPath: string, userId: string) => Promise<T>} fetcher
 * @param {boolean?} useCache
 * @returns {ReturnValues<T>}
 */
export function useAuthorizedFetch(apiPath, fetcher, useCache) {
  const { loggedIn, user } = useAuth();

  const [result, setResult] = useState({
    data: null,
    error: null,
    loading: true,
  });

  const fetch = useCallback(() => {
    if (!loggedIn) {
      return;
    }

    setResult(() => ({
      data: null,
      error: null,
      loading: true,
    }));

    const promise = fetcher(apiPath, user?.id, useCache);

    promise.then((data) => {
      setResult((cur) => ({
        ...cur,
        data,
        loading: false,
      }));
    });

    promise.catch((error) => {
      setResult((cur) => ({
        ...cur,
        error,
        loading: false,
      }));
    });
  }, [apiPath, fetcher, loggedIn, user, useCache]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const res = useMemo(
    () => ({
      ...result,
      revalidate: fetch,
    }),
    [fetch, result],
  );

  return res;
}
