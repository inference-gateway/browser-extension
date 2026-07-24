import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

type State =
  | { kind: "loading" }
  | { kind: "not-github" }
  | { kind: "detected"; owner: string; repo: string; installed: boolean | null; fileUrl?: string; error?: string }
  | { kind: "installing" }
  | { kind: "success"; prUrl: string }
  | { kind: "error"; message: string };

function repoFromUrl(url: string): { owner: string; repo: string } | null {
  const u = new URL(url);
  if (u.hostname !== "github.com") return null;
  const m = u.pathname.match(/^\/([^/]+)\/([^/]+)(\/|$)/);
  if (!m) return null;
  const nonRepo = new Set([
    "orgs", "settings", "notifications", "marketplace", "explore", "sponsors",
    "topics", "collections", "trending", "features", "about", "pricing", "login",
    "join", "new", "codespaces", "pulls", "issues", "dashboard", "search", "apps",
  ]);
  if (nonRepo.has(m[1])) return null;
  return { owner: m[1], repo: m[2] };
}

function Popup() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.url) return setState({ kind: "not-github" });
      const repo = repoFromUrl(tab.url);
      if (!repo) return setState({ kind: "not-github" });
      setState({ kind: "detected", ...repo, installed: null });
      chrome.runtime.sendMessage(
        { type: "check-install", owner: repo.owner, repo: repo.repo },
        (resp) => {
          if (chrome.runtime.lastError || !resp) {
            return setState((s) => s.kind === "detected" ? { ...s, error: "Failed to check install status." } : s);
          }
          if (resp.error) {
            return setState((s) => s.kind === "detected" ? { ...s, error: resp.error } : s);
          }
          setState((s) => s.kind === "detected" ? { ...s, installed: resp.installed, fileUrl: resp.url } : s);
        },
      );
    });
  }, []);

  function doInstall() {
    const s = state;
    if (s.kind !== "detected" || s.installed) return;
    setState({ kind: "installing" });
    chrome.runtime.sendMessage(
      { type: "install", owner: s.owner, repo: s.repo },
      (resp) => {
        if (chrome.runtime.lastError || !resp) {
          return setState({ kind: "error", message: "Failed to send install request." });
        }
        if (resp.error) return setState({ kind: "error", message: resp.error });
        setState({ kind: "success", prUrl: resp.prUrl });
      },
    );
  }

  return (
    <div className="igw-popup">
      {state.kind === "loading" && <p className="igw-popup-muted">Detecting repo...</p>}

      {state.kind === "not-github" && (
        <div className="igw-popup-body">
          <p className="igw-popup-muted">Open a GitHub repository to install the Infer Agent.</p>
        </div>
      )}

      {state.kind === "detected" && (
        <div className="igw-popup-body">
          <p className="igw-popup-repo">{state.owner}/{state.repo}</p>
          {state.error && <p className="igw-popup-error">{state.error}</p>}
          {state.installed === true && (
            <div>
              <button className="igw-popup-btn igw-popup-btn-disabled" disabled>
                Installed
              </button>
              {state.fileUrl && (
                <a className="igw-popup-link" href={state.fileUrl} target="_blank" rel="noopener noreferrer">
                  View workflow file
                </a>
              )}
            </div>
          )}
          {state.installed === false && (
            <button className="igw-popup-btn igw-popup-btn-primary" onClick={doInstall}>
              Install Infer Agent
            </button>
          )}
          {state.installed === null && !state.error && (
            <p className="igw-popup-muted">Checking...</p>
          )}
        </div>
      )}

      {state.kind === "installing" && (
        <div className="igw-popup-body">
          <p className="igw-popup-muted">Creating pull request...</p>
        </div>
      )}

      {state.kind === "success" && (
        <div className="igw-popup-body">
          <p className="igw-popup-success">Pull request created!</p>
          <a className="igw-popup-link" href={state.prUrl} target="_blank" rel="noopener noreferrer">
            View PR
          </a>
        </div>
      )}

      {state.kind === "error" && (
        <div className="igw-popup-body">
          <p className="igw-popup-error">{state.message}</p>
        </div>
      )}

      <div className="igw-popup-footer">
        <a className="igw-popup-link" href="#" onClick={(e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); }}>
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
