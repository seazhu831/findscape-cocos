import {
  _decorator,
  AudioClip,
  AudioSource,
  Component,
  resources,
} from "cc";
import type { FeedbackPlan } from "./feedback-runtime";
import { createAudioPlaybackCommands } from "./audio-feedback-runtime";

const { ccclass } = _decorator;

@ccclass("PortraitAudioFeedback")
export class PortraitAudioFeedback extends Component {
  private readonly clipsByPath = new Map<string, AudioClip>();
  private audioSource: AudioSource | null = null;

  protected onLoad(): void {
    this.audioSource = this.getComponent(AudioSource) ?? this.addComponent(AudioSource);
  }

  public async preload(soundAssets: readonly string[]): Promise<void> {
    const uniquePaths = Array.from(new Set(soundAssets.filter(Boolean)));
    await Promise.all(uniquePaths.map((soundAsset) => this.loadClip(soundAsset)));
    console.info(
      `[FindscapeAudio] Loaded ${this.clipsByPath.size}/${uniquePaths.length} clips`,
    );
  }

  public playPlans(plans: readonly FeedbackPlan[]): void {
    if (!this.audioSource) {
      return;
    }
    for (const command of createAudioPlaybackCommands(plans)) {
      const clip = this.clipsByPath.get(command.soundAsset);
      if (clip) {
        this.audioSource.playOneShot(clip, command.volume);
      } else {
        console.warn(`[FindscapeAudio] Missing clip ${command.soundAsset}`);
      }
    }
  }

  private loadClip(soundAsset: string): Promise<void> {
    return new Promise((resolve) => {
      resources.load(soundAsset, AudioClip, (error, clip) => {
        if (error) {
          console.warn(
            `[PortraitAudioFeedback] Unable to load ${soundAsset}`,
            error,
          );
          resolve();
          return;
        }
        this.clipsByPath.set(soundAsset, clip);
        resolve();
      });
    });
  }
}
