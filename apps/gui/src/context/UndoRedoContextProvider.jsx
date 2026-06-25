import { useState } from "react";
import { UndoRedoContext } from "./UndoRedoContext";

export default function UndoRedoContextProvider({ children }) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  return (
    <UndoRedoContext.Provider value={{ undoStack, redoStack, setUndoStack, setRedoStack }}>
      {children}
    </UndoRedoContext.Provider>
  );
}
