import { createContext, useState, useCallback } from "react";
import { Action, ObjectType } from "../data/constants";
import { useUndoRedo } from "../hooks";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";

export const TypesContext = createContext(null);

export default function TypesContextProvider({ children }) {
  const { t } = useTranslation();
  const [types, setTypes] = useState([]);
  const { setUndoStack, setRedoStack } = useUndoRedo();

  // `data`, when provided, is an undo/redo restore payload of the shape
  // { index, type } - the type object (with its original nanoid id) is
  // re-inserted at its original position.
  const addType = (data, addToHistory = true) => {
    let createdType;
    if (data) {
      createdType = data.type;
      setTypes((prev) => {
        const temp = prev.slice();
        temp.splice(data.index, 0, data.type);
        return temp;
      });
    } else {
      createdType = {
        id: nanoid(),
        name: `type_${types.length}`,
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
          data: {
            index: data?.index ?? types.length,
            type: createdType,
          },
          message: t("add_type"),
        },
      ]);
      setRedoStack([]);
    }
    return createdType;
  };

  // `id` is normally a nanoid string. Numeric ids are still accepted for
  // legacy index-based callers (e.g. TypeField edits) - same shim upstream
  // keeps. TODO(upstream #710): remove index support once all callers pass ids.
  const deleteType = (id, addToHistory = true) => {
    const deletedTypeIndex = types.findIndex((e, i) =>
      typeof id === "number" ? i === id : e.id === id,
    );
    if (addToHistory) {
      Toast.success(t("type_deleted"));
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.TYPE,
          data: {
            index: deletedTypeIndex,
            type: types[deletedTypeIndex],
          },
          message: t("delete_type", {
            typeName: types[deletedTypeIndex].name,
          }),
        },
      ]);
      setRedoStack([]);
    }
    setTypes((prev) =>
      prev.filter((e, i) => (typeof id === "number" ? i !== id : e.id !== id)),
    );
  };

  const updateType = useCallback((id, values) => {
    setTypes((prev) =>
      prev.map((item, index) => {
        const isMatch = typeof id === "number" ? index === id : item.id === id;
        return isMatch ? { ...item, ...values } : item;
      }),
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
