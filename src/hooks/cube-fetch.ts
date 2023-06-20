import { createContext, createSignal } from "solid-js";
import { CubejsApi, Query, isQueryPresent } from "@cubejs-client/core";

import CubeContext from "../CubeContext";

export type CubeFetchOptions = {
  skip?: boolean;
  cubejsApi?: CubejsApi;
  query?: Query;
};

type useCubeFetchProps = {
  method: "meta" | "sql";
};

type Options<T> = T extends "meta"
  ? Omit<CubeFetchOptions, "query">
  : T extends "sql"
  ? CubeFetchOptions
  : never;

export function useCubeFetch<T extends useCubeFetchProps["method"]>(
  method: T,
  options: Options<T>
) {
  const context = createContext(CubeContext);
  const mutexRef = {};

  const [response, setResponse] = createSignal({
    isLoading: false,
    response: null,
  });
  const [error, setError] = createSignal(null);
}
