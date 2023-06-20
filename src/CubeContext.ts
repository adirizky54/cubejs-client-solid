import { CubejsApi } from "@cubejs-client/core";
import { createContext } from "solid-js";

type CubeContextProps = {
  cubejsApi: CubejsApi;
};

export default createContext<CubeContextProps>();
