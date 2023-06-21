// @ts-nocheck

import { createEffect, createSignal, useContext } from "solid-js";
import { CubejsApi, Query, isQueryPresent } from "@cubejs-client/core";

import CubeContext from "../CubeContext";
import { useMounted } from "./use-mounted";

export type CubeFetchOptions = {
  skip?: boolean;
  cubejsApi?: CubejsApi;
  query?: Query;
};

type Method = "meta" | "sql";

type Options<T> = T extends "meta"
  ? Omit<CubeFetchOptions, "query">
  : T extends "sql"
  ? CubeFetchOptions
  : never;

type useCubeFetchProps<T> = {
  method: T;
  options?: Options<T>;
};

export function useCubeFetch<T extends Method>(
  method: T,
  options: CubeFetchOptions
) {
  // export function useCubeFetch<T extends Method>(props: useCubeFetchProps<T>) {
  const isMounted = useMounted();
  const context = useContext(CubeContext);
  const mutexRef = {};

  const [response, setResponse] = createSignal({
    isLoading: false,
    response: null,
  });
  const [error, setError] = createSignal(null);

  const { skip = false } = options;

  async function load(loadOptions: CubeFetchOptions = {}, ignoreSkip = false) {
    const cubejsApi = options?.cubejsApi || context?.cubejsApi;
    const query = loadOptions.query || options?.query;

    const queryCondition =
      method === "meta" ? true : query && isQueryPresent(query);

    if (cubejsApi && (ignoreSkip || !skip) && queryCondition) {
      setError(null);
      setResponse({
        isLoading: true,
        response: null,
      });

      const coreOptions = {
        mutexObj: mutexRef,
        mutexKey: method,
      };
      const args = method === "meta" ? [coreOptions] : [query, coreOptions];

      try {
        const response = await cubejsApi[method](...args);

        if (isMounted()) {
          setResponse({
            response,
            isLoading: false,
          });
        }
      } catch (error) {
        if (isMounted()) {
          setError(error);
          setResponse({
            isLoading: false,
            response: null,
          });
        }
      }
    }
  }

  createEffect(async () => {
    await load();
  });

  return {
    ...response,
    error,
    refetch: (options: CubeFetchOptions) => load(options, true),
  };
}
