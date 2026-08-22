# 《谨言》本地生产包 · START HERE

**推荐：在你 Mac 上用 Chrome 打开 Gemini 制作**（云端 VM 登录 Google/即梦都麻烦）。

| 工具 | 指南 |
|---|---|
| **Gemini 生图 + 即梦视频** | **`GEMINI-LOCAL.md`** ← 主路径 |
| 分镜提示词 | `prompts/E01-shots.md` |

---

## 第一步：拿到文件（30 秒）

```bash
git clone https://github.com/coohhh2408-web/stock-monitor.git
cd stock-monitor
git fetch origin cursor/jinyan-drama-scripts-9047
git checkout cursor/jinyan-drama-scripts-9047
cd drama/jinyan/local-kit
```

---

## 第二步：选工具

- **Gemini（推荐本地）：** Chrome → gemini.google.com → 看 **`GEMINI-LOCAL.md`**
- **即梦：** jimeng.jianying.com → 看 `JIMENG-CLICKS.md`

---

## 第三步：今日目标（只跑通 E1）

| 顺序 | 做什么 | 看哪个文件 |
|---|---|---|
| 1 | 建 5 个角色锚定图 | `prompts/00-characters.md` |
| 2 | 拍第 1 集 8 镜静图 | `prompts/E01-shots.md` |
| 3 | 图生视频 Seedance 2.0 | 即梦「图生视频」，人物锁定 |
| 4 | 剪映合成 60 秒 | `../PRODUCTION-GUIDE.md` Step 5 |

---

## 文件索引

| 文件 | 用途 |
|---|---|
| `prompts/00-characters.md` | 角色锚定提示词（先拍） |
| `prompts/E01-shots.md` | 第 1 集 8 镜，逐镜复制 |
| `../ep01-05-jimeng.md` | 完整分镜+台词 |
| `../COSTUME-MALE35.md` | 穿搭+长靴 B1–B8 |
| `../PRODUCTION-GUIDE.md` | 7 步流水线 |
| `JIMENG-CLICKS.md` | 即梦界面点击路径 |

---

## 和 Agent 协作方式

在本机 Cursor 开对话，说：
- 「E1 镜 1 生成不满意，帮改提示词」
- 「锚定图谷锦丹脸跳了」
- 「继续 E2」

Agent 读 `drama/jinyan/` 下文件，给你下一镜提示词。

---

## 云端 VM 说明

[即梦检查 subagent](ffe84827-82af-4f29-8fc5-d6c890ee020a) 结论：VM 浏览器能开即梦，**生成必须登录你的账号**。本机登录即梦 + 本包 = 最快路径。
