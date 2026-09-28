"use client";

import * as React from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic async data hook for consuming the mock service layer.
 * When services are swapped for real APIs in Phase 3, this hook is unchanged.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = []
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = React.useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (active)
          setState({
            data: null,
            loading: false,
            error: err?.message ?? "Request failed",
          });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = React.useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, reload };
}
