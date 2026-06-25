import { useState, useCallback, useRef, useEffect } from "react";
import { Action, ObjectType, defaultNoteTheme, noteWidth } from "../data/constants";
import { useUndoRedo, useTransform, useSelect } from "../hooks";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { NotesContext } from "./NotesContext";

export default function NotesContextProvider({ children }) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState([]);
  const { transform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();

  // Tracks the next available numeric ID without reading inside setters.
  // Synced from state on every commit so external mutations (import, delete)
  // don't cause ID collisions.
  const nextIdRef = useRef(0);
  useEffect(() => {
    nextIdRef.current = notes.length;
  }, [notes]);

  const addNote = (data, addToHistory = true) => {
    let createdNote;
    if (data) {
      createdNote = data;
      nextIdRef.current += 1;
      setNotes((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    } else {
      const height = 88;
      const id = nextIdRef.current;
      nextIdRef.current = id + 1;
      createdNote = {
        id,
        x: transform.pan.x,
        y: transform.pan.y - height / 2,
        title: `note_${id}`,
        content: "",
        locked: false,
        color: defaultNoteTheme,
        height,
        width: noteWidth,
      };
      setNotes((prev) => [...prev, createdNote]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.NOTE,
          message: t("add_note"),
        },
      ]);
      setRedoStack([]);
    }
    return createdNote;
  };

  const deleteNote = (id, addToHistory = true) => {
    if (addToHistory) {
      Toast.success(t("note_deleted"));
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.NOTE,
          data: notes[id],
          message: t("delete_note", { noteTitle: notes[id].title }),
        },
      ]);
      setRedoStack([]);
    }
    setNotes((prev) => prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i })));
    if (id === selectedElement.id) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
    }
  };

  const updateNote = useCallback((id, values) => {
    setNotes((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...values,
          };
        }
        return t;
      }),
    );
  }, []);

  return (
    <NotesContext.Provider
      value={{
        notes,
        setNotes,
        updateNote,
        addNote,
        deleteNote,
        notesCount: notes.length,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}
