import { expect, test } from "bun:test";
import { DEFAULT_MODELS, DEFAULT_BOT, DEFAULT_PROVIDERS, isModelOption, isBotConfig, prBody, workflowYaml } from "../src/shared/models";

const models = DEFAULT_MODELS;
const def = "anthropic/claude-sonnet-4-6";
const noBot = DEFAULT_BOT;
const bot = { enabled: true, clientId: "Iv23liABC", privateKeySecret: "APP_PRIVATE_KEY" };

test("workflowYaml uses block-list syntax, not inline arrays", () => {
  const yaml = workflowYaml(models, def, noBot);
  expect(yaml).toContain("types:\n      - created");
  expect(yaml).not.toContain("[created]");
  expect(yaml).not.toContain("[opened");
});

test("workflowYaml pins the checkout and infer-action refs", () => {
  const yaml = workflowYaml(models, def, noBot);
  expect(yaml).toContain("uses: actions/checkout@v7.0.1");
  expect(yaml).toContain("uses: inference-gateway/infer-action@v0.34.5");
});

test("workflowYaml exposes model as a workflow_dispatch choice input with all options + default", () => {
  const yaml = workflowYaml(models, def, noBot);
  expect(yaml).toContain("workflow_dispatch:");
  expect(yaml).toContain("type: choice");
  expect(yaml).toContain(`default: ${def}`);
  for (const m of models) expect(yaml).toContain(`          - ${m.model}`);
  expect(yaml).toContain(`model: \${{ inputs.model || '${def}' }}`);
});

test("workflowYaml exposes a prompt input wired to infer-action direct-prompt", () => {
  const yaml = workflowYaml(models, def, noBot);
  expect(yaml).toContain("prompt:\n        description: Task for the agent (workflow_dispatch only)");
  expect(yaml).toContain("direct-prompt: ${{ inputs.prompt }}");
});

test("workflowYaml wires every standard provider key", () => {
  const yaml = workflowYaml(models, def, noBot);
  for (const p of DEFAULT_PROVIDERS) expect(yaml).toContain(`${p.keyInput}: \${{ secrets.${p.secret} }}`);
  expect(DEFAULT_PROVIDERS.length).toBeGreaterThanOrEqual(14);
});

test("workflowYaml appends a custom-model provider key, deduped", () => {
  const custom = [{ model: "acme/rocket-1", keyInput: "acme-api-key", secret: "ACME_API_KEY" }];
  const yaml = workflowYaml(custom, custom[0].model, noBot);
  for (const p of DEFAULT_PROVIDERS) expect(yaml).toContain(`${p.keyInput}: \${{ secrets.${p.secret} }}`);
  expect(yaml).toContain("acme-api-key: ${{ secrets.ACME_API_KEY }}");
  const dup = [
    { model: "anthropic/claude-sonnet-4-6", keyInput: "anthropic-api-key", secret: "ANTHROPIC_API_KEY" },
    { model: "anthropic/claude-haiku-4-5", keyInput: "anthropic-api-key", secret: "ANTHROPIC_API_KEY" },
  ];
  expect(workflowYaml(dup, dup[0].model, noBot).match(/anthropic-api-key:/g)?.length).toBe(1);
});

test("workflowYaml without a bot uses GITHUB_TOKEN and no app-token step", () => {
  const yaml = workflowYaml(models, def, noBot);
  expect(yaml).not.toContain("create-github-app-token");
  expect(yaml).toContain("github-token: ${{ secrets.GITHUB_TOKEN }}");
  expect(yaml).not.toContain("token: ${{ steps.app-token.outputs.token }}");
});

test("workflowYaml with a bot mints an app token and uses it for checkout + infer-action", () => {
  const yaml = workflowYaml(models, def, bot);
  expect(yaml).toContain("uses: actions/create-github-app-token@v3");
  expect(yaml).toContain(`client-id: ${bot.clientId}`);
  expect(yaml).toContain(`private-key: \${{ secrets.${bot.privateKeySecret} }}`);
  expect(yaml).toContain("token: ${{ steps.app-token.outputs.token }}");
  expect(yaml).toContain("github-token: ${{ steps.app-token.outputs.token }}");
  expect(yaml).not.toContain("github-token: ${{ secrets.GITHUB_TOKEN }}");
});

test("prBody names the provider secret and, with a bot, the private-key secret", () => {
  const body = prBody(models, def, noBot);
  expect(body).toContain("`ANTHROPIC_API_KEY`");
  expect(body).not.toContain("`APP_PRIVATE_KEY`");
  expect(prBody(models, def, bot)).toContain("`APP_PRIVATE_KEY`");
});

test("isModelOption accepts a full entry and rejects malformed ones", () => {
  expect(DEFAULT_MODELS.every(isModelOption)).toBe(true);
  expect(isModelOption({ model: "x", keyInput: "y", secret: "z" })).toBe(true);
  expect(isModelOption({ model: "x", keyInput: "y" })).toBe(false);
  expect(isModelOption(null)).toBe(false);
});

test("isBotConfig accepts a full config and rejects malformed ones", () => {
  expect(isBotConfig(DEFAULT_BOT)).toBe(true);
  expect(isBotConfig({ enabled: true, clientId: "a", privateKeySecret: "b" })).toBe(true);
  expect(isBotConfig({ enabled: "yes", clientId: "a", privateKeySecret: "b" })).toBe(false);
  expect(isBotConfig(null)).toBe(false);
});
