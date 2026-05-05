import { createContext, useState, useCallback, useRef, useEffect } from "react";
import { Action, ObjectType } from "../data/constants";
import { useUndoRedo } from "../hooks";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";

export const TypesContext = createContext(null);

export default function TypesContextProvider({ children }) {
  const { t } = useTranslation();
  const [types, setTypes] = useState([]);
  const { setUndoStack, setRedoStack } = useUndoRedo();

  // Tracks the next available numeric ID without reading inside setters.
  // Synced from state on every commit so external mutations (import, etc.)
  // don't cause ID collisions.
  const nextIdRef = useRef(0);
  useEffect(() => {
    nextIdRef.current = types.length;
  }, [types]);

  const addType = (data, addToHistory = true) => {
    let createdType;
    if (data) {
      createdType = data;
      nextIdRef.current += 1;
      setTypes((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp;
      });
    } else {
      const id = nextIdRef.current;
      nextIdRef.current = id + 1;
      createdType = {
        id,
        name: `type_${id}`,
        fields: [],
        comment: "",
      };
      setTypes((prev) => [...prev, createdType]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.TYPE,
          message: t("add_type"),
        },
      ]);
      setRedoStack([]);
    }
    return createdType;
  };

  const deleteType = (id, addToHistory = true) => {
    if (addToHistory) {
      Toast.success(t("type_deleted"));
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.TYPE,
          id: id,
          data: types[id],
          message: t("delete_type", {
            typeName: types[id].name,
          }),
        },
      ]);
      setRedoStack([]);
    }
    setTypes((prev) => prev.filter((e, i) => i !== id));
  };

  const updateType = useCallback((id, values) => {
    setTypes((prev) =>
      prev.map((e, i) => (i === id ? { ...e, ...values } : e)),
    );
  }, []);

  return (
    <TypesContext.Provider
      value={{
        types,
        setTypes,
        addType,
        updateType,
        deleteType,
        typesCount: types.length,
      }}
    >
      {children}
    </TypesContext.Provider>
  );
}
