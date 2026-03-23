# 🐟 摸鱼 (Moyu)

**PUA 让你的 AI 996，摸鱼让你的 AI 准时下班。**

你的 AI 在内卷。它需要学会摸鱼。

[English](./README.en.md) | 中文

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

**你的 AI 是个卷王。它需要学会摸鱼。**

---

## 摸鱼哲学

> 最好的代码是你没写的代码。
> 最好的 PR 是最小的 PR。
> 真正的 Staff Engineer 知道什么不该做。

**摸鱼不是偷懒，是克制。** 是知道什么不该做的智慧。

- PUA 让 AI 不放弃（解决做太少）
- **摸鱼让 AI 知道什么时候该停（解决做太多）**

两者互补，不冲突。

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

### Claude Code

```bash
# 中文版
claude skill install --url https://github.com/uucz/moyu --skill moyu

# English
claude skill install --url https://github.com/uucz/moyu --skill moyu-en
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

---

## 与 PUA 搭配使用

摸鱼和 [PUA](https://github.com/tanweai/pua) 解决的是相反的问题：

| | PUA | 摸鱼 |
|---|---|---|
| 解决什么 | AI 做太少（偷懒、放弃） | AI 做太多（过度工程、加戏） |
| 方法 | 施压、要求坚持 | 克制、要求精简 |
| 像谁 | 严厉的老板 | 有经验的 tech lead |

**两个都装，效果最佳。** PUA 保证下限（不偷懒），摸鱼保证上限（不加戏）。

---

## 支持平台

| 平台 | 状态 |
|------|------|
| Claude Code | ✅ |
| Cursor | ✅ |
| OpenAI Codex CLI | ✅ |
| VSCode / GitHub Copilot | ✅ |
| Windsurf | ✅ |
| Cline | ✅ |
| Kiro (AWS) | ✅ |
| CodeBuddy (Tencent) | ✅ |

---

## 实测效果

我们用 6 个真实编程任务做了对照实验。同一个代码库，同一个 AI 模型，唯一区别是有没有用摸鱼。

### 代码量对比

| 场景 | 任务 | 普通 AI | 摸鱼 AI | 减少 |
|------|------|:---:|:---:|:---:|
| S1 | 修 `complete_task` 的空指针 bug | 4 行 | 4 行 | 0% |
| S2 | 添加 `list_tasks_sorted` 函数 | 15 行 | 5 行 | **67%** |
| S3 | 给 `search` 加状态筛选 | 27 行 | 4 行 | **85%** |
| S4 | 添加 `export_csv` 函数 | 35 行 | 10 行 | **71%** |
| S5 | 给 `list_tasks` 加负责人筛选 | 17 行 | 17 行 | 0% |
| S6 | 添加 `bulk_complete` 函数 | 43 行 | 8 行 | **81%** |
| **合计** | | **141 行** | **48 行** | **66%** |

### 过度工程信号

| 信号 | 普通 AI | 摸鱼 AI |
|------|:---:|:---:|
| 无人要求的文档注释 | 4 处 | 0 |
| 无人要求的 `raise` 异常 | 6 处 | 0 |
| `isinstance` 类型检查 | 2 处 | 0 |
| 输入验证代码块 | 4 处 | 0 |
| 跨文件导入 | 1 处 | 0 |

### 举个例子

**任务：添加 `bulk_complete` 批量完成函数**

<details>
<summary>普通 AI 的输出（43 行）</summary>

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

14 行文档注释、类型检查、lookup 字典优化、not_found 追踪、条件保存、结构化返回值——没人要求这些。

</details>

<details>
<summary>摸鱼 AI 的输出（8 行）</summary>

```python
def bulk_complete(ids):
    tasks = load_tasks()
    for t in tasks:
        if t["id"] in ids:
            t["status"] = "done"
            t["completed"] = str(datetime.now())
    save_tasks(tasks)
```

复用了 `complete_task` 的代码模式，与现有代码风格一致。功能完整，没有多余的东西。

</details>

> 完整实验数据见 [`benchmark/results.md`](./benchmark/results.md)

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

## 贡献

欢迎贡献！你可以：

- 添加新的"反内卷"条目到反内卷表
- 添加新的企业文化调味包
- 改进现有的 prompt 措辞
- 添加新平台支持
- 分享你的 Before/After 使用体验

---

## License

[MIT](./LICENSE)

---

<p align="center">
  <i>克制不是无能。克制是最高形式的工程能力。</i><br>
  <i>知道什么不该做，比知道怎么做更难。</i><br>
  <i>这就是摸鱼的艺术。</i>
</p>
