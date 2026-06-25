import { useState } from "react";
import { LayoutContext } from "./LayoutContext";

export default function LayoutContextProvider({ children }) {
  const [layout, setLayout] = useState({
    header: true,
    sidebar: true,
    issues: true,
    toolbar: true,
    dbmlEditor: false,
    readOnly: false,
  });

  return <LayoutContext.Provider value={{ layout, setLayout }}>{children}</LayoutContext.Provider>;
}
