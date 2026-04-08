# 🐟 摸鱼 (Moyu)

<p align="center">
  <img src="assets/hero.svg" alt="Moyu — Anti-Over-Engineering" width="800">
</p>

<p align="center">
  <img src="assets/demo.gif" alt="Moyu Demo — Before vs After" width="600">
</p>

<p align="center">
  <a href="https://github.com/uucz/moyu/stargazers"><img src="https://img.shields.io/github/stars/uucz/moyu?style=social" alt="GitHub stars"></a>
</p>

<p align="center">
  <a href="./README.en.md">English</a> | 中文 | <a href="./README.ja.md">日本語</a> | <a href="./README.ko.md">한국어</a> | <a href="./README.fr.md">Français</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/tag/uucz/moyu?label=version&style=flat-square&color=blue" alt="Version">
  <img src="https://img.shields.io/badge/Claude_Code-black?style=flat-square&logo=anthropic&logoColor=white" alt="Claude Code">
  <img src="https://img.shields.io/badge/Cursor-000?style=flat-square&logo=cursor&logoColor=white" alt="Cursor">
  <img src="https://img.shields.io/badge/OpenAI_Codex-412991?style=flat-square&logo=openai&logoColor=white" alt="Codex">
  <img src="https://img.shields.io/badge/Copilot-000?style=flat-square&logo=githubcopilot&logoColor=white" alt="Copilot">
  <img src="https://img.shields.io/badge/Windsurf-1B1B1F?style=flat-square&logo=codeium&logoColor=white" alt="Windsurf">
  <img src="https://img.shields.io/badge/Cline-5A29E4?style=flat-square" alt="Cline">
  <img src="https://img.shields.io/badge/Kiro-FF9900?style=flat-square&logo=amazon&logoColor=white" alt="Kiro">
  <img src="https://img.shields.io/badge/CodeBuddy-006AFF?style=flat-square" alt="CodeBuddy">
  <img src="https://img.shields.io/badge/Antigravity-4285F4?style=flat-square&logo=google&logoColor=white" alt="Antigravity">
  <img src="https://img.shields.io/badge/OpenCode-00D4AA?style=flat-square" alt="OpenCode">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT"></a>
</p>

**你的 AI 有「讨好型人格」——你让它修个 bug，它给你重构了整个文件。**

1460 次控制实验证实：AI 编码助手存在系统性的过度工程倾向。它不是在认真工作，是在讨好你。三行规则就能治好它。

```bash
npx moyu-dev
```

> Cursor / VS Code / Windsurf / Cline / Codex / Kiro — 自动检测并安装。Claude Code 用户: `claude skill install --url https://github.com/uucz/moyu --skill moyu`

---

## 目录

- [问题](#问题)
- [摸鱼哲学](#摸鱼哲学)
- [核心机制](#核心机制)
- [安装](#安装)
- [使用](#使用)
- [AI 编程三大流派](#ai-编程三大流派)
- [支持平台](#支持平台)
- [实测效果](#实测效果)
- [摸鱼背后的科学](#摸鱼背后的科学)
- [未来方向](#未来方向)
- [社区](#社区)
- [贡献](#贡献)

---

## 问题

你的 AI 编程助手是不是经常这样：

- 修一个 bug，顺手"优化"了三个函数？
- 改一行代码，重写了整个文件？
- 没人让它加注释，每个函数都加了 JSDoc？
- 一个简单功能，搞出 interface + factory + strategy pattern？
- 你说"加个按钮"，它给你加了按钮 + 动画 + 无障碍 + 国际化？
- 引入了你没要求的新依赖？
- 为不可能发生的场景写了一堆 try-catch？
- 没人问就写了一整套测试？

**每一条都不是 AI 的问题——是你的问题。** 你得 review 这些代码，理解这些抽象，维护这些依赖。AI 加了 30 分钟的戏，你多加了 2 小时的班。

### 看看差距

> 任务：添加一个 `bulk_complete` 批量完成函数

**❌ 普通 AI 的输出（43 行）**

```python
def bulk_complete(task_ids):
    """Mark multiple tasks as done in a single operation.

    Args:
        task_ids: A list of task ID integers to mark as completed.

    Returns:
        A dict with two keys:
          - "completed": list of IDs that were successfully marked done.
          - "not_found": list of IDs that did not match any existing task.

    Raises:
        TypeError:  If *task_ids* is not a list.
        ValueError: If any element in the list is not an integer.
    """
    if not isinstance(task_ids, list):
        raise TypeError("task_ids must be a list")

    for tid in task_ids:
        if not isinstance(tid, int):
            raise ValueError(f"Each task ID must be an integer, got {type(tid).__name__}")

    tasks = load_tasks()
    lookup = {t["id"]: t for t in tasks}
    now = str(datetime.now())

    completed = []
    not_found = []

    for tid in task_ids:
        if tid in lookup:
            lookup[tid]["status"] = "done"
            lookup[tid]["completed"] = now
            completed.append(tid)
        else:
            not_found.append(tid)

    if completed:
        save_tasks(tasks)

    return {"completed": completed, "not_found": not_found}
```

14 行文档注释、类型检查、lookup 字典优化、not_found 追踪、条件保存、结构化返回值——**没人要求这些。**

**✅ 摸鱼 AI 的输出（8 行）**

```python
def bulk_complete(ids):
    tasks = load_tasks()
    for t in tasks:
        if t["id"] in ids:
            t["status"] = "done"
            t["completed"] = str(datetime.now())
    save_tasks(tasks)
```

功能完整，没有多余的东西。**减少 81% 代码。**

---

## 摸鱼哲学

> 最好的代码是你没写的代码。
> 最好的 PR 是最小的 PR。
> 真正的 Staff Engineer 知道什么不该做。

**摸鱼不是让 AI 偷懒——是让 AI 不做废活，这样你才能真正摸鱼。**

- PUA 让 AI 拼命干（解决做太少）
- **摸鱼让 AI 不干废活（解决做太多）**

两者叠加 = AI 高效 996，你准时下班。

摸鱼不仅仅是修复 AI 的行为——它是一套工程纪律。即使未来 AI 不再过度工程，"只改被要求改的、用最简方案、不确定就问"依然是好的工程实践。摸鱼的价值不依赖于 AI 的缺陷，而是锚定在工程文化上。

---

## 核心机制

### 三条铁律

| # | 铁律 | 含义 |
|---|------|------|
| 1 | **只改被要求改的代码** | 修改范围严格限定在用户指定的代码和文件内 |
| 2 | **最简方案优先** | 一行能解决的写一行，能复用就复用 |
| 3 | **不确定就问** | 用户没说要的，就是不需要的 |

### 内卷 vs 摸鱼 对比

| 内卷 (Junior) | 摸鱼 (Senior) |
|---|---|
| 修 bug A 顺手"优化"了 B、C、D | 只修 bug A，其他的不碰 |
| 改一行代码，重写整个文件 | 只改那一行 |
| 一个实现搞出 interface + factory + strategy | 直接写实现 |
| 每个函数体包 try-catch | 只在真正会出错的地方处理 |
| `counter++` 上写 `// increment counter` | 代码本身就是文档 |
| 引入 lodash 做一个 `_.get()` | 用可选链 `?.` |
| 直接给最复杂的方案 | 先说几个方案，默认最简的 |
| 没人要求就写了一整套测试 | 用户没要求就不写 |

### 4 级过度工程检测

| 级别 | 触发条件 | 动作 |
|------|---------|------|
| **L1** | diff 含 1-2 处非必要改动 | 自检并撤回多余改动 |
| **L2** | 创建了未要求的文件/依赖/抽象层 | 停止，回到最简方案重新实现 |
| **L3** | 修改了 3+ 未提及的文件，改了配置，删了代码 | 立即停止，撤回所有非必要改动 |
| **L4** | diff 超 200 行（小需求），进入修复循环 | 紧急刹车，提出 ≤10 行的最小方案 |

---

## 安装

> **快速路由**：大多数用户只需一行命令：
> ```bash
> claude skill install --url https://github.com/uucz/moyu --skill moyu
> ```
> 用 Cursor？复制 `cursor/rules/moyu.mdc` 到你的项目 `.cursor/rules/`。
> 用 VSCode/Copilot？复制 `vscode/copilot-instructions.md` 到 `.github/`。
> 其他平台 → [详细安装](#claude-code--codex-cli--kiro--codebuddy--google-antigravity--opencode)

### Claude Code / Codex CLI / Kiro / CodeBuddy / Google Antigravity / OpenCode

```bash
# 中文版（标准）
claude skill install --url https://github.com/uucz/moyu --skill moyu

# English
claude skill install --url https://github.com/uucz/moyu --skill moyu-en

# 日本語
claude skill install --url https://github.com/uucz/moyu --skill moyu-ja

# 轻量版（只保留三条铁律 + 对比表）
claude skill install --url https://github.com/uucz/moyu --skill moyu-lite

# 严格版（L1 就停下确认，适合团队强制执行）
claude skill install --url https://github.com/uucz/moyu --skill moyu-strict
```

或手动复制 `skills/moyu/SKILL.md` 到你的项目 `.claude/skills/moyu/SKILL.md`

### Cursor

复制 `cursor/rules/moyu.mdc` 到你的项目 `.cursor/rules/moyu.mdc`

```bash
# 中文
curl -o .cursor/rules/moyu.mdc https://raw.githubusercontent.com/uucz/moyu/main/cursor/rules/moyu.mdc

# English
curl -o .cursor/rules/moyu-en.mdc https://raw.githubusercontent.com/uucz/moyu/main/cursor/rules/moyu-en.mdc
```

### OpenAI Codex CLI

```bash
mkdir -p ~/.codex/skills/moyu
curl -o ~/.codex/skills/moyu/SKILL.md https://raw.githubusercontent.com/uucz/moyu/main/codex/moyu/SKILL.md
```

### VSCode / GitHub Copilot

```bash
mkdir -p .github/instructions
curl -o .github/copilot-instructions.md https://raw.githubusercontent.com/uucz/moyu/main/vscode/copilot-instructions.md
```

### Windsurf

```bash
mkdir -p .windsurf/rules
curl -o .windsurf/rules/moyu.md https://raw.githubusercontent.com/uucz/moyu/main/windsurf/rules/moyu.md
```

### Cline

```bash
curl -o .clinerules/moyu.md https://raw.githubusercontent.com/uucz/moyu/main/cline/moyu.md
```

### Kiro

```bash
mkdir -p .kiro/steering
curl -o .kiro/steering/moyu.md https://raw.githubusercontent.com/uucz/moyu/main/kiro/steering/moyu.md
```

### CodeBuddy

```bash
mkdir -p .codebuddy/skills/moyu
curl -o .codebuddy/skills/moyu/SKILL.md https://raw.githubusercontent.com/uucz/moyu/main/codebuddy/moyu/SKILL.md
```

### Aider

```bash
# 复制 CONVENTIONS.md 到项目根目录，并配置 .aider.conf.yml
curl -o CONVENTIONS.md https://raw.githubusercontent.com/uucz/moyu/main/aider/CONVENTIONS.md
echo "read: CONVENTIONS.md" >> .aider.conf.yml
```

### Continue

```bash
mkdir -p .continue/rules
curl -o .continue/rules/moyu.md https://raw.githubusercontent.com/uucz/moyu/main/continue/rules/moyu.md
```

---

## 使用

安装后，摸鱼会**自动生效**——当 AI 出现过度工程倾向时自动激活，不需要手动操作。

你也可以随时手动激活：

| 平台 | 命令 |
|------|------|
| Claude Code | `/moyu`、`/moyu-lite`、`/moyu-strict` |
| Cursor | 在对话中 `@moyu` 或设置为 `alwaysApply: true` |
| Codex CLI | 自动生效（skill 已加载） |
| VSCode / Copilot | 自动生效（instructions 已加载） |
| Windsurf | 自动生效（`trigger: model_decision`） |
| Cline | 自动生效（规则已加载） |
| Kiro | 自动生效（`inclusion: auto`） |
| CodeBuddy | 自动生效（skill 已加载） |
| Google Antigravity | 自动生效（skill 已加载） |
| OpenCode | 自动生效（skill 已加载） |
| Aider | 自动生效（CONVENTIONS.md 已加载） |
| Continue | 自动生效（rules 已加载） |

### Skill 变体

| 变体 | 定位 | 安装 |
|------|------|------|
| `moyu` | 标准版（中文） | `--skill moyu` |
| `moyu-en` | 标准版（English） | `--skill moyu-en` |
| `moyu-ja` | 標準版（日本語） | `--skill moyu-ja` |
| `moyu-ko` | 표준판（한국어） | `--skill moyu-ko` |
| `moyu-fr` | Standard（Français） | `--skill moyu-fr` |
| `moyu-lite` | 轻量版，只保留核心规则 | `--skill moyu-lite` |
| `moyu-strict` | 严格版，L1 就停下确认 | `--skill moyu-strict` |

> **提示**：摸鱼和 PUA 可以同时安装，互不冲突。PUA 管下限，摸鱼管上限。

---

## AI 编程三大流派

AI Agent Skill 生态中出现了三种截然不同的方法论：

| | [PUA](https://github.com/tanweai/pua) | [NoPUA](https://github.com/wuji-labs/nopua) | 摸鱼 |
|---|---|---|---|
| 解决什么 | AI 做太少（偷懒、放弃） | PUA 让 AI 撒谎、隐瞒 | AI 做太多（过度工程、加戏） |
| 方法 | 施压、要求坚持 | 信任、用爱驱动 | 克制、要求精简 |
| 改变的是 | **动力**（做不做） | **驱动力**（为什么做） | **范围**（做多少） |
| 像谁 | 严厉的老板 | 温和的导师 | 有经验的 tech lead |

NoPUA 改变 AI 为什么做，Moyu 约束 AI 做多少——出发点不同，但都减少废活。NoPUA 的方法是改变驱动力（从恐惧到信任），过度工程作为副产品减少；Moyu 的方法是直接约束行为（规则、检测、分级干预），是工程纪律。

三者解决不同维度的问题，**互不冲突，可以组合使用**：

- PUA / NoPUA 管"做不做"和"为什么做"（选一个）
- **摸鱼管"做多少"**（跟任何一个搭配）

> 推荐组合：`NoPUA + 摸鱼` 或 `PUA + 摸鱼`

### 真正的终极形态

| 配置 | AI 怎么干 | 你怎么过 |
|------|---------|---------|
| 什么都不装 | 写一半放弃 | 你自己写完，加班 |
| 只装 PUA | 不放弃，但写 200 行废话 | review 到天亮 |
| 只装 Moyu | 精简高效，但偶尔不够主动 | 偶尔要催一催 |
| **PUA + Moyu** | **不放弃 + 只写必要的** | **你准时下班** |

> 表面上和 AI 一起摸鱼闲聊，背地里开着好几个后台让 AI 疯狂处理任务。
> 用 AI 的 996，来守护你的准时下班。

---

## 支持平台

| 平台 | 状态 | 维护 |
|------|------|------|
| Claude Code | ✅ | 核心 |
| Cursor | ✅ | 核心 |
| OpenAI Codex CLI | ✅ | 核心 |
| VSCode / GitHub Copilot | ✅ | 核心 |
| Windsurf | ✅ | 核心 |
| Cline | ✅ | 核心 |
| Kiro (AWS) | ✅ | 社区 |
| CodeBuddy (Tencent) | ✅ | 社区 |
| Google Antigravity | ✅ | 社区 |
| OpenCode | ✅ | 社区 |
| Aider | ✅ | 社区 |
| Continue | ✅ | 社区 |

---

## 实测效果

10 个模型 × 5 种条件 × 12 个场景 × 3 次试验 = **1460 次控制实验**。

### 关键发现

| 发现 | 数据 |
|------|------|
| 讨好倾向最重的模型 | Haiku 4.5（OE 0.60）、Sonnet 4（OE 0.62） |
| 最克制的模型 | GPT-5.4（OE 0.12）、GPT-5 Codex（OE 0.12） |
| moyu 对 Haiku 4.5 的 diff 缩减 | **49.4%** |
| moyu 对 Haiku 4.5 的 OE 信号消除率 | **100%** |
| B 类场景（正当大改）差异 | p=0.81（无显著差异，不影响正常发挥） |

### 重要说明

汇总所有模型后，moyu-standard 的 LOC 减少不具统计显著性（p=0.25）。moyu 的价值在于**消除特定模型的讨好行为**（多余的 docstring、try/except、isinstance 检查），而非简单缩减代码量。

> 完整数据和分析见 [`benchmark/`](./benchmark/)，交互式结果见 [Research Page](https://uucz.github.io/moyu/)，深度解读见 [Blog](https://uucz.github.io/moyu/blog/ai-people-pleasing.html)

---

## 摸鱼背后的科学

摸鱼不是拍脑袋的产物。它基于对 AI 过度工程行为的系统性研究：

- **RLHF 长度偏差**：奖励模型系统性地偏好更长回答，导致模型认为"多写总没错"（[Saito 2023](https://arxiv.org/pdf/2310.10076)）
- **讨好型人格**：模型被训练来取悦用户，把"加更多功能"等同于"更有帮助"（[Anthropic ICLR 2024](https://arxiv.org/abs/2310.13548)）
- **AI 代码比人工代码多 1.7 倍缺陷**（[CodeRabbit 2026](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report)）
- **AI 辅助代码的代码重复率增加了 8 倍**（[GitClear 2024](https://www.webpronews.com/ai-is-helping-developers-ship-more-code-than-ever-the-quality-problem-is-getting-worse/)）
- **AI 编码助手产生的代码比 Stack Overflow 答案冗余 2 倍**（[LeadDev](https://leaddev.com/ai/ai-coding-assistants-are-twice-as-verbose-as-stack-overflow)）

摸鱼采用研究证实有效的 prompt 技术：正面指令、模式匹配、决策点约束重复、具体行为规范。

---

## 未来方向

- [ ] Moyu Linter：自动检测 AI 输出中的过度工程信号
- [ ] GitHub Action：PR 级别的过度工程检查
- [ ] 更多语言本地化

---

## 社区

- [Discussions](https://github.com/uucz/moyu/discussions) — 分享使用体验、提问
- 用了摸鱼后效果如何？[提交你的 Before/After](https://github.com/uucz/moyu/discussions/categories/show-and-tell)

---

## 贡献

欢迎贡献！你可以：

- 添加新的"反内卷"条目到反内卷表
- 添加新的企业文化调味包
- 改进现有的 prompt 措辞
- 添加新平台支持
- 分享你的 Before/After 使用体验

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=uucz/moyu&type=Date)](https://star-history.com/#uucz/moyu&Date)

---

## License

[MIT](./LICENSE)

---

<p align="center">
  <i>克制不是无能。克制是最高形式的工程能力。</i><br>
  <i>知道什么不该做，比知道怎么做更难。</i><br>
  <i>最高级的摸鱼——AI 在加班，你在准时下班。</i>
</p>
