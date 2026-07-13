# Handoff: Findscape — Cocos Creator 隐藏物品游戏资产包

给开发 Agent（Codex / Claude Code 等）的交付说明。本包是 **可直接使用的生产 PNG 资产**（非 HTML 原型），配套原始需求 PDF（`original_brief.pdf`）与各批次决策说明。

## 任务

按 `original_brief.pdf` 第 7 节的开发接收规范，把资产接入 Cocos Creator 运行时：

1. 将本包内的源导出保留在 `design/claude-design/source/{assetId}/` 下（保留原始文件名）。
2. 将审核通过的文件规范化到稳定运行时路径（见下方映射）。**语义资产 ID 不得重命名**。
3. 运行时负责放置/高亮/移除/动画/计分独立的目标精灵；干净地图中**不含任何目标物**。

## 资产清单与运行时映射

### batch_a_world_targets/（世界与核心目标）

| 文件 | 规格 | 运行时路径 |
|---|---|---|
| source_map_demo_cozy_town_placeholder_20260713_02.png | 1600×2400 竖版，不透明 — **主地图（手机）** | art/maps/demo_cozy_town_placeholder |
| source_map_demo_cozy_town_placeholder_20260713_01.png | 2400×1600 横版备选（PDF 原规格） | 备选，同 ID |
| source_target_pineapple_20260713_01.png | 512×512 透明 | art/targets/target_pineapple |
| source_target_balloon_20260713_01.png | 512×512 透明 | art/targets/target_balloon |
| source_target_thief_20260713_01.png | 512×512 透明 | art/targets/target_thief |
| source_target_puppy_20260713_01.png | 512×512 透明 | art/targets/target_puppy |
| source_target_gem_20260713_01.png | 512×512 透明 | art/targets/target_gem |
| review_composite_anchor_check_*.png | 仅供审核，**不接入运行时** | — |

**竖版地图运行时锚点**（1600×2400，左上原点；仅构图引导，目标由运行时摆放）：

- pineapple ①: (330, 860) — 果篮/市场摊位旁
- puppy: (480, 1980) — 长椅+花槽/低矮花园
- balloon ①: (930, 360) — 商店间天空空隙/彩旗
- thief: (1060, 1310) — 报亭+木箱/广场
- pineapple ②: (1330, 1040) — 咖啡桌+水果篮
- gem: (1200, 2090) — 排水口+花坛/石板地
- balloon ②: (1170, 1620) — 华盖+灯柱/彩旗

横版备选图沿用 PDF 原坐标（420,980 / 720,1340 / 980,360 / 1320,840 / 1670,1160 / 1880,1380 / 2040,520）。

地图上目标合成尺寸参考：约 135–170 px（地图源尺度），保证 ~64 px 屏显时可辨识。

### batch_b_icons_tools/（图标与工具，均 256×256 透明，无按钮底）

| 文件 | 运行时路径 |
|---|---|
| source_icon_pineapple_20260713_01.png | art/icons/icon_pineapple |
| source_icon_balloon_20260713_01.png | art/icons/icon_balloon |
| source_icon_thief_20260713_01.png | art/icons/icon_thief |
| source_icon_puppy_20260713_01.png | art/icons/icon_puppy |
| source_icon_gem_20260713_01.png | art/icons/icon_gem |
| source_tool_hint_20260713_01.png | art/icons/tool_hint |
| source_tool_magnifier_20260713_01.png | art/icons/tool_magnifier |

32–48 px 下可读；按钮背景由 UI 层绘制。

### batch_c_ui_feedback/（HUD 与反馈）

| 文件 | 规格 | 运行时路径 |
|---|---|---|
| source_ui_hud_reference_20260713_01.png | 1080×1920，不透明 — **实现参考，非切图** | art/feedback/…（参考） |
| source_feedback_find_success_20260713_01.png | 1024×1024 透明 · 4 状态 · ~700ms | art/feedback/feedback_find_success |
| source_feedback_pop_success_20260713_01.png | 同上 · ~500ms | art/feedback/feedback_pop_success |
| source_feedback_catch_success_20260713_01.png | 同上 · ~800ms | art/feedback/feedback_catch_success |
| source_feedback_hint_reveal_20260713_01.png | 同上 · ~2000ms | art/feedback/feedback_hint_reveal |
| source_feedback_wrong_tap_20260713_01.png | 同上 · ~300ms | art/feedback/feedback_wrong_tap |

反馈表状态从左到右、从上到下推进；全部效果可由精灵 + 粒子 + scale/opacity/位移补间实现（时长见上）。HUD 参考要点：顶部安全区条（时间/分数/连击）、底部目标清单（Batch B 图标 + 剩余数角标）、左右下角提示/放大镜按钮；触控目标 ≥88 源像素；数字为占位。

## HUD 参考的关键度量（1080×1920 源尺度）

- 顶部条：x50 y90 w980 h140，圆角 42
- 底部目标面板：x50 y1626 w980 h200，圆角 46；5 个图标槽间距 190，图标 140
- 提示/放大镜按钮：圆形 r82，圆心 (140,1500) / (940,1500)
- 计数角标：r30，莓红 #c0526b，白色数字

## 设计令牌

- 轮廓线：#6b5744（暖棕，全部资产统一，无纯黑）
- 调色板：叶绿 #7fb069 · 天蓝 #8fc1e3 · 珊瑚 #f08a7a · 明黄 #f2c94c · 莓红 #c0526b · 薰衣草 #b49fd1 · 暖白 #fdf6e6 / #f7efdd · 木色 #a97e55
- HUD 面板底：rgba(253,246,230,0.96)，描边 #6b5744 6px

## 注意事项

- `review_*` 文件与 `decision_note_*.txt` 仅供审核记录，不进入运行时。
- 干净地图不含目标物、HUD、文字；招牌均为空白——不要在地图上烘焙任何内容。
- 文件名中的 `_01/_02` 表示刻意的备选（如横竖版地图），不是版本号。
- 各批次的 decision_note_*.txt 记录了调色、线条处理、偏差与开放问题。
