// @ts-nocheck

import { createEffect, createSignal, onCleanup, useContext } from "solid-js";
import {
  isQueryPresent,
  areQueriesEqual,
  DeeplyReadonly,
  Query,
  CubejsApi,
  ResultSet,
  ProgressResponse,
  QueryRecordType,
} from "@cubejs-client/core";

import CubeContext from "../CubeContext";
import { useMounted } from "./use-mounted";

type UseCubeQueryOptions = {
  /**
   * A `CubejsApi` instance to use. Taken from the context if the param is not passed
   */
  cubejsApi?: CubejsApi;
  /**
   * Query execution will be skipped when `skip` is set to `true`. You can use this flag to avoid sending incomplete queries.
   */
  skip?: boolean;
  /**
   * Use continuous fetch behavior. See [Real-Time Data Fetch](real-time-data-fetch)
   */
  subscribe?: boolean;
  /**
   * When `true` the resultSet will be reset to `null` first
   */
  resetResultSetOnChange?: boolean;
};

type UseCubeQueryResult<TData> = {
  error: Error | null;
  isLoading: boolean;
  resultSet: ResultSet<TData> | null;
  progress: ProgressResponse;
  refetch: () => Promise<void>;
};

export function useCubeQuery<
  TData,
  TQuery extends DeeplyReadonly<Query> = DeeplyReadonly<Query>
>(
  query: TQuery,
  options?: UseCubeQueryOptions
): UseCubeQueryResult<unknown extends TData ? QueryRecordType<TQuery> : TData> {
  const mutexRef = {};
  const isMounted = useMounted();
  const [currentQuery, setCurrentQuery] =
    createSignal<DeeplyReadonly<Query> | null>(null);
  const [isLoading, setLoading] = createSignal(false);
  const [resultSet, setResultSet] = createSignal<
    | UseCubeQueryResult<
        unknown extends TData ? QueryRecordType<TQuery> : TData
      >["resultSet"]
    | null
  >(null);
  const [progress, setProgress] = createSignal<ProgressResponse | null>(null);
  const [error, setError] = createSignal<Error | null>(null);
  const context = useContext(CubeContext);

  let subscribeRequest = null;

  const progressCallback = ({
    progressResponse,
  }: {
    progressResponse: ProgressResponse;
  }) => setProgress(progressResponse);

  async function fetch() {
    const cubejsApi = options?.cubejsApi || context?.cubejsApi;

    if (!cubejsApi) {
      throw new Error("Cube.js API client is not provided");
    }

    if (options?.resetResultSetOnChange) {
      setResultSet(null);
    }

    setError(null);
    setLoading(true);

    try {
      const response = await cubejsApi.load(query, {
        mutexObj: mutexRef,
        mutexKey: "query",
      });

      if (isMounted()) {
        setResultSet(response);
        setProgress(null);
      }
    } catch (error) {
      if (isMounted()) {
        setError(error);
        setResultSet(null);
        setProgress(null);
      }
    }

    if (isMounted()) {
      setLoading(false);
    }
  }

  createEffect(() => {
    const cubejsApi = options?.cubejsApi || context?.cubejsApi;

    if (!cubejsApi) {
      throw new Error("Cube.js API client is not provided");
    }

    async function loadQuery() {
      if (!options?.skip && isQueryPresent(query)) {
        if (!areQueriesEqual(currentQuery(), query)) {
          if (
            options?.resetResultSetOnChange == null ||
            options?.resetResultSetOnChange
          ) {
            setResultSet(null);
          }
          setCurrentQuery(query);
        }

        setError(null);
        setLoading(true);

        try {
          if (subscribeRequest) {
            await subscribeRequest.unsubscribe();
            subscribeRequest = null;
          }

          if (options.subscribe) {
            subscribeRequest = cubejsApi.subscribe(
              query,
              {
                mutexObj: mutexRef.current,
                mutexKey: "query",
                progressCallback,
              },
              (e, result) => {
                if (isMounted()) {
                  if (e) {
                    setError(e);
                  } else {
                    setResultSet(result);
                  }
                  setLoading(false);
                  setProgress(null);
                }
              }
            );
          } else {
            await fetch();
          }
        } catch (e) {
          if (isMounted()) {
            setError(e);
            setResultSet(null);
            setLoading(false);
            setProgress(null);
          }
        }
      }
    }

    loadQuery();
  });

  onCleanup(() => {
    if (subscribeRequest) {
      subscribeRequest.unsubscribe();
      subscribeRequest = null;
    }
  });

  return {
    isLoading: isLoading(),
    resultSet: resultSet(),
    error: error(),
    progress: progress(),
    refetch: fetch,
  };
}
