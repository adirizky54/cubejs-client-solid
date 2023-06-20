import { CubeFetchOptions, useCubeFetch } from "./cube-fetch";

export function useCubeMeta(options: Omit<CubeFetchOptions, "query"> = {}) {
  return useCubeFetch("meta", options);
}
