import { createContext } from "react";
import { State } from "../data/constants";

export const SaveStateContext = createContext(State.NONE);
