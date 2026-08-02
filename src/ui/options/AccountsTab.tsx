import type { BotConfig } from "../../shared/models";
import type { Account } from "./types";
import { Section } from "./Section";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";

export function AccountsTab({
  account,
  accounts,
  selected,
  activeToken,
  ownerChoices,
  appUrl,
  showToken,
  setShowToken,
  setSelected,
  updateAccount,
  updateBot,
  addAccount,
  removeAccount,
}: {
  account: Account;
  accounts: Account[];
  selected: number;
  activeToken: string;
  ownerChoices: string[];
  appUrl: string;
  showToken: boolean;
  setShowToken: (v: boolean | ((p: boolean) => boolean)) => void;
  setSelected: (i: number) => void;
  updateAccount: (patch: Partial<Account>) => void;
  updateBot: (patch: Partial<BotConfig>) => void;
  addAccount: () => void;
  removeAccount: () => void;
}) {
  return (
    <>
      <Section
        title="Accounts"
        description={
          <>
            Pick a GitHub account or org to configure its token and bot below. On a repo, the
            account whose <strong>owner</strong> matches its owner is used.
          </>
        }
      >
        <Label htmlFor="igw-owner">Owner (your GitHub user or an org)</Label>
        <div className="flex items-center gap-2">
          <Select
            value={account.owner || undefined}
            onValueChange={(owner) => {
              const idx = accounts.findIndex((a) => a.owner === owner);
              if (idx >= 0 && idx !== selected) setSelected(idx);
              else updateAccount({ owner });
            }}
          >
            <SelectTrigger id="igw-owner" className="flex-1">
              <SelectValue
                placeholder={activeToken ? "Select an owner…" : "Enter a token below to load owners"}
              />
            </SelectTrigger>
            <SelectContent>
              {ownerChoices.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addAccount}>Add account</Button>
          <Button variant="outline" onClick={removeAccount}>
            Remove
          </Button>
        </div>
      </Section>

      <Section
        title="Personal access token"
        description={
          <>
            Required to install the OpenTask Agent workflow and send tasks. Also used to list skills
            in <strong>private</strong> repos. Fine-grained token with <code>Contents: write</code>,{" "}
            <code>Pull requests: write</code>, <code>Workflows: write</code>, <code>Issues: write</code>,
            and <code>Actions: write</code>. Stored in this browser's extension storage.
          </>
        }
      >
        <div className="flex items-center gap-2">
          <Input
            type={showToken ? "text" : "password"}
            className="flex-1"
            placeholder="github_pat_..."
            autoComplete="off"
            value={account.token}
            onChange={(e) => updateAccount({ token: e.target.value })}
          />
          <Button variant="outline" onClick={() => setShowToken((v) => !v)}>
            {showToken ? "Hide" : "Show"}
          </Button>
        </div>
        <div>
          <Button
            asChild
            variant="outline"
          >
            <a
              href="https://github.com/settings/personal-access-tokens/new?name=OpenTask&description=OpenTask+browser+extension&contents=write&pull_requests=write&workflows=write&issues=write&actions=write"
              target="_blank"
              rel="noreferrer"
            >
              Create token
            </a>
          </Button>
        </div>
      </Section>

      <Section
        title="Custom bot"
        description={
          <>
            Run the agent as a GitHub App for <strong>{account.owner || "this account"}</strong> instead
            of <code>github-actions[bot]</code>. When enabled, the generated workflow mints a token with{" "}
            <code>actions/create-github-app-token@v3</code> and checks out + comments as your App, so its
            comments and commits are attributed to (and verified for) the App.
          </>
        }
      >
        <div>
          <Button asChild>
            <a href={appUrl} target="_blank" rel="noreferrer">
              Create GitHub App
            </a>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="igw-bot-enabled"
            checked={account.bot.enabled}
            onCheckedChange={(v) => updateBot({ enabled: v })}
          />
          <Label htmlFor="igw-bot-enabled">Use a custom bot (GitHub App)</Label>
        </div>
        {account.bot.enabled && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="igw-bot-client-id">App Client ID</Label>
            <Input
              id="igw-bot-client-id"
              placeholder="Iv23li..."
              autoComplete="off"
              value={account.bot.clientId}
              onChange={(e) => updateBot({ clientId: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              On your App's settings page (<strong>General</strong>) under <strong>Client ID</strong> - it
              starts with <code>Iv23li…</code>. This is <strong>not</strong> the numeric <em>App ID</em>{" "}
              (e.g. <code>4394298</code>) shown at the top of the same page. You can also enter the
              name of a repo secret holding it (e.g. <code>APP_CLIENT_ID</code>) and the workflow
              will read it from <code>secrets</code>.
            </p>
            <Label htmlFor="igw-bot-secret">Private-key secret name</Label>
            <Input
              id="igw-bot-secret"
              placeholder="OPENTASK_APP_PRIVATE_KEY"
              autoComplete="off"
              value={account.bot.privateKeySecret}
              onChange={(e) => updateBot({ privateKeySecret: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Add this repo secret with your App's private key. The Client ID is inlined into the
              workflow (it isn't sensitive).
            </p>
          </div>
        )}
      </Section>
    </>
  );
}
