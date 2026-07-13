'use strict';

const RETRY_COUNT = 100;
const RETRY_DELAY_MS = 25;

function findLoadedModule(suffix) {
  const moduleId = Object.keys(require.cache).find((id) => id.endsWith(suffix));
  return moduleId ? require(moduleId) : null;
}

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function restoreBuiltinAssetHandlers() {
  for (let attempt = 0; attempt < RETRY_COUNT; attempt += 1) {
    const managerModule = findLoadedModule('/manager/asset-handler-manager.ccc');
    const pluginModule = findLoadedModule('/manager/plugin.ccc');
    const manager = managerModule && managerModule.assetHandlerManager;
    const plugin = pluginModule && (pluginModule.default || pluginModule);
    const engineInfo = plugin && plugin.packageRegisterInfo
      ? plugin.packageRegisterInfo['engine-extends']
      : null;

    if (manager && Object.keys(manager.name2registerInfo).length > 0) {
      return;
    }

    if (manager && engineInfo && engineInfo.assetHandlerInfos?.length) {
      await manager.init();
      if (Object.keys(manager.name2registerInfo).length > 0) {
        console.info('[Findscape] Restored Cocos Creator asset handlers.');
        return;
      }
    }

    await wait(RETRY_DELAY_MS);
  }

  throw new Error('[Findscape] Cocos Creator asset handlers were not available before AssetDB startup.');
}

module.exports = {
  methods: {
    beforePreStart: restoreBuiltinAssetHandlers,
  },
};
