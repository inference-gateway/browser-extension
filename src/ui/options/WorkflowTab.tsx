import type { PluginOption } from "../../shared/models";
import { DEFAULT_TIMEOUT } from "../../shared/models";
import { Section, ToggleRow } from "./Section";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

export function WorkflowTab({
  timeout,
  setTimeoutMin,
  plugins,
  setPlugins,
}: {
  timeout: number;
  setTimeoutMin: (n: number) => void;
  plugins: PluginOption[];
  setPlugins: (p: PluginOption[]) => void;
}) {
  return (
    <>
      <Section
        title="Workflow"
        description={
          <>
            Per-run job timeout for the generated workflow. Applies to newly installed workflows; re-run{" "}
            <strong>Install</strong> on a repo to update an existing one.
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="igw-timeout">Timeout (minutes)</Label>
          <Input
            id="igw-timeout"
            type="number"
            min={1}
            className="w-32"
            value={timeout}
            onChange={(e) => setTimeoutMin(e.target.value === "" ? DEFAULT_TIMEOUT : Number(e.target.value))}
          />
        </div>
      </Section>

      <Section
        title="Plugins"
        description={
          <>
            Optional{" "}
            <a href="https://github.com/inference-gateway/infer-action" className="underline">
              infer-action
            </a>{" "}
            plugins the installed workflow pre-installs to extend the agent. All off by default; check the
            ones you want. <strong>Re-install the workflow</strong> after changing these.
          </>
        }
      >
        {plugins.map((p) => (
          <ToggleRow
            key={p.id}
            checked={p.enabled}
            onChange={(v) => setPlugins(plugins.map((x) => (x.id === p.id ? { ...x, enabled: v } : x)))}
          >
            <code>{p.id}</code>
          </ToggleRow>
        ))}
      </Section>
    </>
  );
}
