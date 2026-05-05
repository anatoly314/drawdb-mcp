import { createContext, useState, useCallback, useRef, useEffect } from "react";
import { Action, ObjectType } from "../data/constants";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useUndoRedo } from "../hooks";

export const EnumsContext = createContext(null);

export default function EnumsContextProvider({ children }) {
  const { t } = useTranslation();
  const [enums, setEnums] = useState([]);
  const { setUndoStack, setRedoStack } = useUndoRedo();

  // Tracks the next available numeric ID without reading inside setters.
  // Synced from state on every commit so external mutations (import, etc.)
  // don't cause ID collisions.
  const nextIdRef = useRef(0);
  useEffect(() => {
    nextIdRef.current = enums.length;
  }, [enums]);

  const addEnum = (data, addToHistory = true) => {
    let createdEnum;
    if (data) {
      createdEnum = data;
      nextIdRef.current += 1;
      setEnums((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp;
      });
    } else {
      const id = nextIdRef.current;
      nextIdRef.current = id + 1;
      createdEnum = {
        id,
        name: `enum_${id}`,
        values: [],
      };
      setEnums((prev) => [...prev, createdEnum]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.ENUM,
          message: t("add_enum"),
        },
      ]);
      setRedoStack([]);
    }
    return createdEnum;
  };

  const deleteEnum = (id, addToHistory = true) => {
    if (addToHistory) {
      Toast.success(t("enum_deleted"));
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.ENUM,
          id: id,
          data: enums[id],
          message: t("delete_enum", {
            enumName: enums[id].name,
          }),
        },
      ]);
      setRedoStack([]);
    }
    setEnums((prev) => prev.filter((_, i) => i !== id));
  };

  const updateEnum = useCallback((id, values) => {
    setEnums((prev) =>
      prev.map((e, i) => (i === id ? { ...e, ...values } : e)),
    );
  }, []);

  return (
    <EnumsContext.Provider
      value={{
        enums,
        setEnums,
        addEnum,
        updateEnum,
        deleteEnum,
        enumsCount: enums.length,
      }}
    >
      {children}
    </EnumsContext.Provider>
  );
}
