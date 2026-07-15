import {
  createBrowserStoragePort,
  type BrowserStorageLike,
} from "./browser-storage";
import {
  createWeChatStoragePort,
  type WeChatStorageApi,
} from "./wechat-storage";
import type { KeyValueStoragePort } from "../storage/storage-port";

export type RuntimeStoragePlatform = "wechat" | "browser";

export interface RuntimeStorageEnvironment {
  browserStorage?: BrowserStorageLike;
  wechatStorage?: WeChatStorageApi;
}

export interface RuntimeStorageSelection {
  platform: RuntimeStoragePlatform;
  port: KeyValueStoragePort;
}

export function createRuntimeStoragePort(
  environment: RuntimeStorageEnvironment,
): RuntimeStorageSelection {
  const wechatStorage =
    environment.wechatStorage ?? getGlobalWeChatStorageApi();
  if (wechatStorage) {
    return {
      platform: "wechat",
      port: createWeChatStoragePort(wechatStorage),
    };
  }

  return {
    platform: "browser",
    port: createBrowserStoragePort(environment.browserStorage),
  };
}

export function getGlobalWeChatStorageApi(): WeChatStorageApi | undefined {
  const candidate = (globalThis as { wx?: Partial<WeChatStorageApi> }).wx;
  if (
    typeof candidate?.getStorage !== "function" ||
    typeof candidate.setStorage !== "function" ||
    typeof candidate.removeStorage !== "function"
  ) {
    return undefined;
  }

  return candidate as WeChatStorageApi;
}
