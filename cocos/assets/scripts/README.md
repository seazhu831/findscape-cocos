# Scripts

Suggested TypeScript module boundaries for the Cocos client:

- `app/`: app bootstrap, scene flow, and high-level orchestration.
- `gameplay/`: map viewport, target runtime, mode controller, scoring, timer, tools, and settlement.
- `config/`: typed config loading and validation adapters.
- `ui/`: target list, HUD, settlement, mode selection, and common UI components.
- `feedback/`: visual and audio feedback presets.
- `platform/`: WeChat, Web, native, storage, sharing, and SDK adapters.
- `storage/`: local save and future cloud-sync boundaries.

Keep modules data-driven where possible. Mode differences should start in config and feedback presets before becoming custom code.
