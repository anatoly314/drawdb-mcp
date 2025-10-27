import { createContext, useState, useCallback } from "react";
import { Action, ObjectType } from "../data/constants";
import { useUndoRedo } from "../hooks";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";

export const TypesContext = createContext(null);

export default function TypesContextProvider({ children }) {
  const { t } = useTranslation();
  const [types, setTypes] = useState([]);
  const { setUndoStack, setRedoStack } = useUndoRedo();

  const addType = (data, addToHistory = true) => {
    let createdType;
    if (data) {
      setTypes((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp;
      });
      createdType = data;
    } else {
      setTypes((prev) => {
        createdType = {
          id: prev.length,
          name: `type_${prev.length}`,
          fields: [],
          comment: "",
        };
        return [...prev, createdType];
      });
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
