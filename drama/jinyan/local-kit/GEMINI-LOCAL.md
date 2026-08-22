# 《谨言》本地生产 · Gemini + 剪映

**适用：** 在你自己的 Mac 上，用 Chrome 打开 Gemini 制作（云端 VM 需单独登录 Google，建议直接本地做）。

---

## 0. 拉代码（一次性）

```bash
git clone https://github.com/coohhh2408-web/stock-monitor.git
cd stock-monitor
git fetch origin cursor/jinyan-drama-scripts-9047
git checkout cursor/jinyan-drama-scripts-9047
```

物料目录：`drama/jinyan/local-kit/`

本地建文件夹：
```bash
mkdir -p ~/Jinyan/output/characters ~/Jinyan/output/E01
```

---

## 1. 打开 Gemini（Chrome）

1. Chrome → https://gemini.google.com
2. 用 **你自己的 Google 账号** 登录
3. 确认能用 **生图**（Gemini 2.0 Flash / Imagen，或订阅版）

> 若只有文字、没有出图：升级 Gemini Advanced，或改用 https://aistudio.google.com 生图。

---

## 2. 角色锚定（5 人 · 先做谷锦丹）

**操作：**
1. 新建对话
2. 输入下面提示词 + **说明：「请生成竖屏 9:16 比例图片」**
3. 生成 2–4 次，选最稳的一张
4. 下载 → 存 `~/Jinyan/output/characters/谷锦丹.png`

**谷锦丹（复制）：**
```
请生成一张竖屏9:16写实照片，不要文字水印：
32岁中国女性，高挑纤腰长腿，冷白皮，S曲线，大波浪，红唇妆，
酒红缎面单侧露背短礼服，香槟色仿皮草短披肩，10cm裸色细高跟，超薄肤丝，
毛绒质感清晰，全身照，侧逆光，电影质感，8K
```

**温清遥、宋谨言、顾正纲、章世藩：** 见 `prompts/00-characters.md`，每条前加「请生成竖屏9:16写实照片：」

**一致性技巧：**
- 后续镜头用 **「参考上一张图同一人物」** + 上传 `谷锦丹.png` 作为附件
- 或 Gemini 对话里 **不要新开对话**，在同一线程里改场景

---

## 3. 第 1 集 · 8 镜静图

文件：`prompts/E01-shots.md`

| 镜 | 做法 |
|---|---|
| S01 门缝 | 上传 `谷锦丹.png` + 粘贴 S01 提示词 |
| S02–S08 | 有 @角色 的上传对应参考图 |

**S01 示例（上传谷锦丹后发送）：**
```
基于参考图同一人物，生成竖屏9:16：
酒红缎面露背短礼服，香槟仿皮草披肩半滑落，酒店包厢门缝，
背影腰线，侧脸微笑，侧逆光，写实真人
```

每张下载命名：`E01_S01.png` … `E01_S08.png`

---

## 4. 静图 → 视频（二选一）

### 方案 A · Gemini / Veo（有订阅或 API）

1. Gemini 或 https://labs.google/fx/tools/video-generation（Flow）
2. **图生视频**，上传静图
3. 动效提示（只写运动）：
   ```
   固定机位，门缝裁切，人物轻微动，3秒，竖屏9:16
   ```
4. 单镜约 5–8 秒，导出 mp4

### 方案 B · 即梦（仅视频这一步）

静图用 Gemini 做好 → 即梦 **图生视频 Seedance** → 人物锁定 → 导出

### 方案 C · 静图 + 剪映 Ken Burns（最快试播）

剪映里对静图加 **缩放/平移** 动画，先拼一版 60 秒试节奏。

---

## 5. 剪映合成 E1（60 秒）

1. 导入 8 段视频（或 8 张动效静图）
2. **AI 配音** — 台词见 `E01-shots.md` 底部
3. 字幕 + 关键词加粗
4. 集末 0.5s 黑屏：「下集：门岗敬礼，总编还在吼」
5. 导出 `JY_E01_撤稿.mp4`（1080×1920，58–62 秒）

---

## 6. 和 Cloud Agent 协作（本地做、云端改词）

你在本地 Gemini 生成，在 Cursor 对话里发：

- 「S01 门缝不像，帮改 Gemini 提示词」
- 「脸和锚定图不像」
- 「写 E2 的 Gemini 版分镜」

Agent 读 `drama/jinyan/` 给你下一版可复制提示词。

---

## 7. 本地 vs 云端

| | 本地 Mac | 云端 VM |
|---|---|---|
| Gemini 登录 | ✅ 你的 Google 账号 | ❌ 需再在 VM 登一次 |
| 即梦登录 | ✅ 你的手机号 | ❌ 需再在 VM 登一次 |
| **推荐** | **在这里做** | 仅作改剧本/提示词 |

---

## 8. 今晚最小目标

- [ ] 谷锦丹锚定图 1 张满意
- [ ] E01 S01 门缝 1 张满意
- [ ] 剪映里 S01 有画面 + 一句 VO 试拼

做完回 **「S01 好了」** 或贴图描述问题，我继续给 S02–S08。
