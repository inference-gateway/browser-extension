import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import * as storage from "./shared/storage";

type Theme = "system" | "light" | "dark";

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  if (theme === "dark") {
    html.setAttribute("data-theme", "dark");
  } else {
    html.removeAttribute("data-theme");
  }
}

// Install now lives in GitHub's own repo nav (the "Tasks" tab, injected by the content
// script). The toolbar popup is just a pointer + Settings.
function Popup() {
  useEffect(() => {
    void (async () => {
      const t = await storage.get<string>("theme") as Theme | undefined;
      if (t === "light" || t === "dark") {
        applyTheme(t);
      } else {
        applyTheme("system");
      }
    })();
  }, []);

  return (
    <div className="igw-popup">
      <div className="igw-popup-body">
        <p className="igw-popup-muted">
          Open a repository on GitHub and use the <strong>Tasks</strong> tab in the repo
          navigation to install the Infer Agent.
        </p>
      </div>
      <div className="igw-popup-footer">
        <a
          className="igw-popup-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            chrome.runtime.openOptionsPage();
          }}
        >
          Settings
        </a>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
);
