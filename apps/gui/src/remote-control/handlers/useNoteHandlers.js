import { useNotes } from "../../hooks";
import { useServerHandler } from "../ws";

/**
 * Server->client handlers for note commands: addNote / updateNote / deleteNote.
 *
 * Same model as areas: numeric array-index ids on the GUI side, string ids on
 * the wire, hence the `parseInt(params.id, 10)` lookups.
 */
export default function useNoteHandlers() {
  const { notes, addNote, updateNote, deleteNote } = useNotes();

  useServerHandler("addNote", (params) => {
    // Backend only ever sends `data: null`; non-null data would be misread by
    // the context's add() as an undo/redo `{index, entity}` shape.
    if (params.data != null) {
      throw new Error("addNote with non-null data is not supported");
    }
    return addNote(null, params.addToHistory ?? true);
  });

  useServerHandler("updateNote", (params) => {
    const noteToUpdate = notes.find((n) => n.id === parseInt(params.id, 10));
    if (!noteToUpdate) {
      throw new Error(`Note with id "${params.id}" not found`);
    }
    updateNote(noteToUpdate.id, params.updates);
  });

  useServerHandler("deleteNote", (params) => {
    const noteToDelete = notes.find((n) => n.id === parseInt(params.id, 10));
    if (!noteToDelete) {
      throw new Error(`Note with id "${params.id}" not found`);
    }
    deleteNote(noteToDelete.id, params.addToHistory ?? true);
  });
}
