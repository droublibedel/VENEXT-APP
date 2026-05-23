import { Injectable } from "@nestjs/common";

import { RELATIONAL_LEVEL_5_DEPTH_CLASSIFICATION } from "./relational-analytic-depth";
import { RELATIONAL_LAYER_REGISTRY, type RelationalLayerRegistryEntry } from "./relational-layer-registry.data";

@Injectable()
export class RelationalLayerRegistryService {
  getLevel5Layers(): readonly RelationalLayerRegistryEntry[] {
    return RELATIONAL_LAYER_REGISTRY;
  }

  getByInstruction(instruction: string): RelationalLayerRegistryEntry | undefined {
    return RELATIONAL_LAYER_REGISTRY.find((l) => l.instruction === instruction);
  }

  getBySlug(slug: string): RelationalLayerRegistryEntry | undefined {
    return RELATIONAL_LAYER_REGISTRY.find((l) => l.layerSlug === slug);
  }

  getTerminalLayer(): RelationalLayerRegistryEntry {
    return RELATIONAL_LAYER_REGISTRY[RELATIONAL_LAYER_REGISTRY.length - 1]!;
  }

  getIngestionChainOrder(): readonly string[] {
    return RELATIONAL_LAYER_REGISTRY.map((l) => l.syncMethod);
  }

  assertRegistryIntegrity(): void {
    const orders = RELATIONAL_LAYER_REGISTRY.map((l) => l.order);
    const sorted = [...orders].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] !== i + 1) {
        throw new Error("relational layer registry order gap");
      }
    }
    const terminals = RELATIONAL_LAYER_REGISTRY.filter((l) => l.terminal);
    if (terminals.length !== 1 || terminals[0]!.instruction !== "20.43") {
      throw new Error("relational layer registry must have exactly one terminal layer 20.43");
    }
    for (let i = 0; i < RELATIONAL_LAYER_REGISTRY.length - 1; i++) {
      const cur = RELATIONAL_LAYER_REGISTRY[i]!;
      const next = RELATIONAL_LAYER_REGISTRY[i + 1]!;
      if (cur.chainsToSyncMethod !== next.syncMethod) {
        throw new Error(
          `ingestion chain mismatch: ${cur.instruction} chains to ${cur.chainsToSyncMethod} but ${next.instruction} sync is ${next.syncMethod}`,
        );
      }
    }
    if (RELATIONAL_LAYER_REGISTRY.length !== RELATIONAL_LEVEL_5_DEPTH_CLASSIFICATION.length) {
      throw new Error("depth classification count mismatch with layer registry");
    }
  }
}
