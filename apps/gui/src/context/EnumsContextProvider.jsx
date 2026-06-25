import { useState, useCallback } from "react";
import { Action, ObjectType } from "../data/constants";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useUndoRedo } from "../hooks";
import { nanoid } from "nanoid";
import { EnumsContext } from "./EnumsContext";

export default function EnumsContextProvider({ children }) {
  const { t } = useTranslation();
  const [enums, setEnums] = useState([]);
  const { setUndoStack, setRedoStack } = useUndoRedo();

  // `data`, when provided, is an undo/redo restore payload of the shape
  // { index, enum } - the enum object (with its original nanoid id) is
  // re-inserted at its original position.
  const addEnum = (data, addToHistory = true) => {
    let createdEnum;
    if (data) {
      createdEnum = data.enum;
      setEnums((prev) => {
        const temp = prev.slice();
        temp.splice(data.index, 0, data.enum);
        return temp;
      });
    } else {
      createdEnum = {
        id: nanoid(),
        name: `enum_${enums.length}`,
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
          data: {
            index: data?.index ?? enums.length,
            enum: createdEnum,
          },
          message: t("add_enum"),
        },
      ]);
      setRedoStack([]);
    }
    return createdEnum;
  };

  const deleteEnum = (id, addToHistory = true) => {
    const enumIndex = enums.findIndex((e) => e.id === id);
    if (addToHistory) {
      Toast.success(t("enum_deleted"));
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.ENUM,
          data: {
            index: enumIndex,
            enum: enums[enumIndex],
          },
          message: t("delete_enum", {
            enumName: enums[enumIndex].name,
          }),
        },
      ]);
      setRedoStack([]);
    }
    setEnums((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEnum = useCallback((id, values) => {
    setEnums((prev) => prev.map((e) => (e.id === id ? { ...e, ...values } : e)));
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
