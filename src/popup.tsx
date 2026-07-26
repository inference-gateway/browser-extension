import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import * as storage from "./shared/storage";
import { applyTheme, type Theme } from "./shared/theme";

// Install now lives in GitHub's own repo nav (the "Tasks" tab, injected by the content
// script). The toolbar popup is just a pointer + Settings.
function Popup() {
  useEffect(() => {
    void (async () => {
      const t = (await storage.get<string>("theme")) as Theme | undefined;
      applyTheme(t === "light" || t === "dark" ? t : "system");
    })();
  }, []);

  return (
    <div className="w-72 bg-background text-foreground text-sm">
      <div className="p-4">
        <p className="text-muted-foreground leading-relaxed">
          Open a repository on GitHub and use the <strong className="text-foreground">Tasks</strong> tab
          in the repo navigation to install the OpenTask Agent.
        </p>
      </div>
      <div className="border-t px-4 py-2 text-right">
        <a
          className="text-primary hover:underline cursor-pointer"
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
