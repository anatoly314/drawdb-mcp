import { createContext } from "react";

export const UndoRedoContext = createContext({
  undoStack: [],
  setUndoStack: () => {},
  redoStack: [],
  setRedoStack: () => {},
});
