import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(
  scriptDir,
  "fixtures/audio-feedback-runtime-cases.json",
);
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const defaultVolume = 0.65;

for (const fixture of fixtures) {
  assert.deepEqual(
    createAudioPlaybackCommands(fixture.plans, fixture.volume),
    fixture.expected,
    fixture.name,
  );
}

console.log(`Validated ${fixtures.length} audio feedback runtime fixture groups`);

function createAudioPlaybackCommands(plans, volume = defaultVolume) {
  const safeVolume = Math.min(1, Math.max(0, volume));
  return plans.flatMap((plan) =>
    plan.kind === "preset" && plan.soundAsset
      ? [{ planId: plan.planId, soundAsset: plan.soundAsset, volume: safeVolume }]
      : [],
  );
}
