import { CubeFetchOptions, useCubeFetch } from "./cube-fetch";

type useCubeSqlProps = {
  query: CubeFetchOptions["query"];
  options?: CubeFetchOptions;
};

export function useCubeSql(
  query: useCubeSqlProps["query"],
  options: useCubeSqlProps["options"] = {}
) {
  return useCubeFetch("sql", {
    ...options,
    query,
  });
}
