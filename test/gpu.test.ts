import { describe, expect, test } from "bun:test";
import { LLAMA_MODELS, podRequestBody } from "../src/shared/messages";

describe("LLAMA_MODELS", () => {
  test("ids are unique", () => {
    const ids = LLAMA_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("hf refs match repo/name:quant shape", () => {
    for (const m of LLAMA_MODELS) {
      expect(m.hf).toMatch(/^[\w.-]+\/[\w.-]+:[\w]+$/);
    }
  });
});

describe("podRequestBody", () => {
  test("runs llama.cpp server with the chosen model", () => {
    const body = podRequestBody("NVIDIA GeForce RTX 4090", LLAMA_MODELS[0]);
    expect(body.imageName).toBe("ghcr.io/ggml-org/llama.cpp:server-cuda");
    expect(body.gpuTypeIds).toEqual(["NVIDIA GeForce RTX 4090"]);
    expect(body.cloudType).toBe("SECURE");
    expect(body.ports).toEqual(["8080/http"]);
    expect(body.dockerStartCmd).toEqual([
      "-hf", LLAMA_MODELS[0].hf, "--host", "0.0.0.0", "--port", "8080", "-ngl", "99",
    ]);
  });

  test("honors cloudType override", () => {
    expect(podRequestBody("gpu", LLAMA_MODELS[0], "COMMUNITY").cloudType).toBe("COMMUNITY");
  });
});
