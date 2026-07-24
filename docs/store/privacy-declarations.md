# Store Privacy Declarations

Reusable, copy-paste answers for the Web Store listing's **Privacy** tab. Keep these
in sync with `manifest.json` and [`PRIVACY.md`](../../PRIVACY.md). These declarations
apply identically to Chrome Web Store, Microsoft Edge Add-ons, and Firefox Add-ons.

## Single purpose

> Adds skill tab-completion and a quick-prompts palette to GitHub's issue and pull
> request comment boxes. Typing `!` lists the current repository's skills (read from
> `.agents/skills/` via the GitHub Contents API); a keyboard shortcut opens a palette
> of common bot directives. That is the extension's only function.

## Permission justifications

### `storage`
> Stores the user's settings on their own device: an optional GitHub token, the
> editable quick-prompts list, and a short-lived (10-minute) per-repository cache of
> skill folder names. Nothing is synced or sent to a server.

### Host permission - `https://api.github.com/*`
> The extension calls the GitHub Contents API
> (`GET /repos/{owner}/{repo}/contents/.agents/skills`) to list a repository's skills.
> This is the only external request the extension makes. If the user has saved a
> personal access token, it is attached solely to authenticate this request for
> private repositories.

### Content-script host access - `https://github.com/*`
> The content script runs on github.com to detect the issue/PR comment textarea,
> render the completion dropdown and prompts palette, and insert text at the caret.
> It reads only the focused comment box's value/caret and the page path (to resolve
> `owner/repo`); it does not read other page content, cookies, or credentials.

## Remote code

> **No.** The extension executes no remotely hosted code. All logic ships in the
> package; the only network call fetches JSON data (a directory listing), never code.

## Data usage disclosures

- **Data collected:** none is transmitted to the developer. There is no backend
  server, no analytics, and no telemetry.
- **GitHub token / settings:** stored locally in `chrome.storage.local` on the user's
  device only.
- **Not sold or transferred** to third parties.
- **Not used** for anything unrelated to the single purpose above.
- **No creditworthiness / lending** use.

The full user-facing policy is [`PRIVACY.md`](../../PRIVACY.md), linked from the
store listing's *Privacy policy URL* field.
