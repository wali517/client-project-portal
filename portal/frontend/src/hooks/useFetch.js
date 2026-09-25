import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../utils/errors.js";

export const useFetch = (fetcher, deps = [], { enabled = true } = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      if (mounted.current) setData(response);
    } catch (err) {
      if (mounted.current) setError(getErrorMessage(err));
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, isLoading, error, refetch: run, setData };
};

export default useFetch;
