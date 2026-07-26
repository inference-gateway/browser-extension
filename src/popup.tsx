import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import * as storage from "./shared/storage";
import { applyTheme, type Theme } from "./shared/theme";
import { GPU_TYPES, LLAMA_MODELS, type GpuState, type ProvisionGPUResponse, type GPUStatusResponse, type DeprovisionGPUResponse } from "./shared/messages";
import { ask } from "./ui/ask";
import { Button } from "@/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";

// A "name = value" row with a click-to-copy button for the value.
function CopyRow({ label, name, value }: { label: string; name: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <span className="truncate" title={value}>
        {label} <code className="text-foreground">{name}</code> = <code className="text-foreground">{value}</code>
      </span>
      <button
        className="ml-auto shrink-0 text-primary hover:underline"
        onClick={() => { void navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function Popup() {
  const [gpu, setGpu] = useState<GpuState>({ status: "idle" });
  const [selectedGpu, setSelectedGpu] = useState(GPU_TYPES[0].id);
  const [selectedModel, setSelectedModel] = useState(LLAMA_MODELS[0].id);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const t = (await storage.get<string>("theme")) as Theme | undefined;
      applyTheme(t === "light" || t === "dark" ? t : "system");
    })();
  }, []);

  // Load last known GPU state on mount
  useEffect(() => {
    ask({ type: "gpu-status" }, (resp) => {
      const r = resp as GPUStatusResponse;
      if ("state" in r) setGpu(r.state);
    });
  }, []);

  useEffect(() => {
    if (gpu.status !== "provisioning") return;
    const id = setInterval(() => {
      ask({ type: "gpu-status" }, (resp) => {
        const r = resp as GPUStatusResponse;
        if ("state" in r) setGpu(r.state);
      });
    }, 3000);
    return () => clearInterval(id);
  }, [gpu.status]);

  function provision() {
    setError("");
    ask({ type: "provision-gpu", gpuTypeId: selectedGpu, modelId: selectedModel }, (resp) => {
      const r = resp as ProvisionGPUResponse;
      if ("error" in r) return setError(r.error);
      setGpu(r.state);
    });
  }

  function deprovision() {
    setError("");
    ask({ type: "deprovision-gpu" }, (resp) => {
      const r = resp as DeprovisionGPUResponse;
      if ("error" in r) return setError(r.error);
      setGpu(r.state);
    });
  }

  return (
    <div className="w-72 bg-background text-foreground text-sm">
      <div className="p-4">
        <p className="text-muted-foreground leading-relaxed">
          Open a repository on GitHub and use the <strong className="text-foreground">Tasks</strong> tab
          in the repo navigation to install the OpenTask Agent.
        </p>
      </div>

      <div className="border-t px-4 py-3">
        <h3 className="font-medium mb-2">GPU</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-block w-2 h-2 rounded-full ${
            gpu.status === "running" ? "bg-green-500" :
            gpu.status === "provisioning" ? "bg-yellow-500 animate-pulse" :
            gpu.status === "failed" ? "bg-red-500" :
            "bg-gray-400"
          }`} />
          <span className="text-muted-foreground capitalize">
            {gpu.status}
            {gpu.modelId && gpu.status !== "idle" && (
              <> &mdash; {LLAMA_MODELS.find((m) => m.id === gpu.modelId)?.label ?? gpu.modelId}</>
            )}
          </span>
        </div>
        {gpu.status === "running" && gpu.endpointUrl && (
          <div className="text-xs text-muted-foreground mb-2 space-y-1">
            <p>Add to the repo's Settings &rarr; Secrets and variables &rarr; Actions:</p>
            <CopyRow label="Secret" name="LLAMACPP_API_URL" value={`${gpu.endpointUrl}/v1`} />
            {gpu.modelId && <CopyRow label="Variable" name="DEFAULT_MODEL" value={`llamacpp/${gpu.modelId}`} />}
            <p>Re-install the workflow (from a repo's Tasks tab) to pick up llama.cpp support.</p>
          </div>
        )}
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        <div className="flex flex-col gap-2">
          {(gpu.status === "idle" || gpu.status === "failed") && (
            <>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLAMA_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedGpu} onValueChange={setSelectedGpu}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GPU_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <div className="flex gap-2">
            {gpu.status === "idle" || gpu.status === "failed" ? (
              <Button size="xs" onClick={provision}>Deploy</Button>
            ) : (
              <Button size="xs" variant="destructive" onClick={deprovision}>Deprovision</Button>
            )}
          </div>
        </div>
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
