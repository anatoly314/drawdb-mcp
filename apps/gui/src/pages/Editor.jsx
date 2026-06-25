import LayoutContextProvider from "../context/LayoutContextProvider";
import TransformContextProvider from "../context/TransformContextProvider";
import TablesContextProvider from "../context/DiagramContextProvider";
import UndoRedoContextProvider from "../context/UndoRedoContextProvider";
import SelectContextProvider from "../context/SelectContextProvider";
import AreasContextProvider from "../context/AreasContextProvider";
import NotesContextProvider from "../context/NotesContextProvider";
import TypesContextProvider from "../context/TypesContextProvider";
import TasksContextProvider from "../context/TasksContextProvider";
import SaveStateContextProvider from "../context/SaveStateContextProvider";
import EnumsContextProvider from "../context/EnumsContextProvider";
import WorkSpace from "../components/Workspace";
import { useThemedPage } from "../hooks";

export default function Editor() {
  useThemedPage();

  return (
    <LayoutContextProvider>
      <TransformContextProvider>
        <UndoRedoContextProvider>
          <SelectContextProvider>
            <TasksContextProvider>
              <AreasContextProvider>
                <NotesContextProvider>
                  <TypesContextProvider>
                    <EnumsContextProvider>
                      <TablesContextProvider>
                        <SaveStateContextProvider>
                          <WorkSpace />
                        </SaveStateContextProvider>
                      </TablesContextProvider>
                    </EnumsContextProvider>
                  </TypesContextProvider>
                </NotesContextProvider>
              </AreasContextProvider>
            </TasksContextProvider>
          </SelectContextProvider>
        </UndoRedoContextProvider>
      </TransformContextProvider>
    </LayoutContextProvider>
  );
}
