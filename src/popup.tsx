import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as storage from "./shared/storage";
import { applyTheme, type Theme } from "./shared/theme";
import type { GpuState, GpuType } from "./shared/messages";
import { ask } from "./ui/ask";
import { Button } from "@/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";

function Popup() {
  const [gpu, setGpu] = useState<GpuState>({ status: "idle" });
  const [gpuTypes, setGpuTypes] = useState<GpuType[]>([]);
  const [selectedGpu, setSelectedGpu] = useState("NVIDIA-GeForce-RTX-4090");
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void (async () => {
      const t = (await storage.get<string>("theme")) as Theme | undefined;
      applyTheme(t === "light" || t === "dark" ? t : "system");
    })();
  }, []);

  // Fetch GPU types on mount
  useEffect(() => {
    ask({ type: "list-gpus" }, (resp) => {
      if (!resp.error && (resp as { gpus: GpuType[] }).gpus) {
        setGpuTypes((resp as { gpus: GpuType[] }).gpus);
      }
    });
  }, []);

  // Poll for status while provisioning
  useEffect(() => {
    if (gpu.status === "provisioning") {
      pollRef.current = setInterval(() => {
        ask({ type: "gpu-status" }, (resp) => {
          if (resp.error) return;
          setGpu((resp as { state: GpuState }).state);
        });
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [gpu.status]);

  function provision() {
    setError("");
    ask({ type: "provision-gpu", gpuTypeId: selectedGpu }, (resp) => {
      if (resp.error) return setError(resp.error);
      setGpu((resp as { state: GpuState }).state);
    });
  }

  function deprovision() {
    setError("");
    ask({ type: "deprovision-gpu" }, (resp) => {
      if (resp.error) return setError(resp.error);
      setGpu((resp as { state: GpuState }).state);
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
          <span className="text-muted-foreground capitalize">{gpu.status}</span>
        </div>
        {gpu.endpointUrl && (
          <p className="text-xs text-muted-foreground mb-2 truncate" title={gpu.endpointUrl}>{gpu.endpointUrl}</p>
        )}
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        <div className="flex flex-col gap-2">
          {(gpu.status === "idle" || gpu.status === "failed") && gpuTypes.length > 0 && (
            <Select value={selectedGpu} onValueChange={setSelectedGpu}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gpuTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.displayName || t.name} &mdash; ${t.securePrice}/hr
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex gap-2">
            {gpu.status === "idle" || gpu.status === "failed" ? (
              <Button size="xs" onClick={provision}>Provision GPU</Button>
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
