import { ParentProps } from "solid-js";
import { CubejsApi } from "@cubejs-client/core";
import CubeContext from "./CubeContext";

type CubeProviderProps = {
  cubejsApi: CubejsApi
}

export default function CubeProvider(props: ParentProps<CubeProviderProps>) {
  return <CubeContext.Provider value={{ cubejsApi: props.cubejsApi }}>{props.children}</CubeContext.Provider>;
}
