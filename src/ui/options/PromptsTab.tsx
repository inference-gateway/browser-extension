import { Section } from "./Section";
import { Textarea } from "@/ui/components/textarea";

const JSON_CLASS = "font-mono text-xs min-h-48";

export function PromptsTab({
  promptsText,
  setPromptsText,
  instructions,
  setInstructions,
  modelsText,
  setModelsText,
}: {
  promptsText: string;
  setPromptsText: (v: string) => void;
  instructions: string;
  setInstructions: (v: string) => void;
  modelsText: string;
  setModelsText: (v: string) => void;
}) {
  return (
    <>
      <Section
        title="Quick prompts"
        description={
          <>
            A JSON array of <code>{"{ id, label, description, insert }"}</code>. Shown in the palette.
          </>
        }
      >
        <Textarea
          className={JSON_CLASS}
          spellCheck={false}
          value={promptsText}
          onChange={(e) => setPromptsText(e.target.value)}
        />
      </Section>

      <Section
        title="System instructions"
        description={
          <>
            Extra guidance baked into the workflow's <code>custom-instructions</code> when you install
            or re-install it. Use it to steer agent behavior (e.g. "post the full review in a single
            comment covering every changed file"). <strong>Re-install the workflow</strong> after
            editing; leave blank to omit the block.
          </>
        }
      >
        <Textarea
          className="text-xs min-h-48"
          spellCheck={false}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </Section>

      <Section
        title="Install models"
        description={
          <>
            A JSON array of <code>{"{ model, keyInput, secret }"}</code>. Offered in the toolbar popup's
            Install dropdown; the first entry is the default. <code>keyInput</code> is the infer-action
            provider-key input (e.g. <code>anthropic-api-key</code>) and <code>secret</code> is the repo
            secret it reads. Add custom models here.
          </>
        }
      >
        <Textarea
          className={JSON_CLASS}
          spellCheck={false}
          value={modelsText}
          onChange={(e) => setModelsText(e.target.value)}
        />
      </Section>
    </>
  );
}
