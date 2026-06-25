import { useState } from "react";
import { State } from "../data/constants";
import { SaveStateContext } from "./SaveStateContext";

export default function SaveStateContextProvider({ children }) {
  const [saveState, setSaveState] = useState(State.NONE);

  return (
    <SaveStateContext.Provider value={{ saveState, setSaveState }}>
      {children}
    </SaveStateContext.Provider>
  );
}
