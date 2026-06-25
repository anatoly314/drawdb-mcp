import { useEffect, useState } from "react";
import { SettingsContext, defaultSettings } from "./SettingsContext";

function loadSettings() {
  const stored = localStorage.getItem("settings");
  if (stored) {
    return { ...defaultSettings, ...JSON.parse(stored) };
  }
  return defaultSettings;
}

export default function SettingsContextProvider({ children }) {
  // Lazy initializer: read persisted settings once during the first render
  // instead of in an effect (which would force an extra render right after
  // mount). localStorage is synchronous, so this is safe at init time.
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    document.body.setAttribute("theme-mode", settings.mode);
  }, [settings.mode]);

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
