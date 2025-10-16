import ReactDOM from "react-dom/client";
import { LocaleProvider } from "@douyinfe/semi-ui";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.jsx";
import en_US from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import "./index.css";
import "./i18n/i18n.js";

const root = ReactDOM.createRoot(document.getElementById("root"));

// Only enable Vercel Analytics on Vercel deployments
const isVercel = import.meta.env.VITE_VERCEL === '1' || typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

root.render(
  <LocaleProvider locale={en_US}>
    <App />
    {isVercel && <Analytics />}
    {isVercel && <SpeedInsights />}
  </LocaleProvider>,
);
