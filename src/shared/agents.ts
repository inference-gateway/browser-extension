// The Inference Gateway agents registry (inference-gateway/agents) and types for the
// Agents panel. The registry publishes a catalog.json at the jsdelivr CDN endpoint
// containing an array of ADL agent documents, each with metadata and a _source block.

export type AgentManifest = {
  metadata: {
    name: string;
    description: string;
    version: string;
  };
  _source: {
    repo: string;
    ref: string;
  };
};

export const REGISTRY = { owner: "inference-gateway", repo: "agents" };

export const CATALOG_URL =
  "https://cdn.jsdelivr.net/gh/inference-gateway/agents@main/catalog.json";

export function isAgentManifest(m: unknown): m is AgentManifest {
  if (!m || typeof m !== "object") return false;
  const o = m as Record<string, unknown>;
  const meta = o.metadata as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== "object") return false;
  return (
    typeof meta.name === "string" &&
    typeof meta.description === "string" &&
    typeof meta.version === "string"
  );
}
