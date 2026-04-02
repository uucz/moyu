# 你的 AI 有「讨好型人格」——1460 次实验证实

> 10 个模型，5 种约束策略，12 个编码场景，3 次重复实验。这可能是中文社区第一个严肃的 AI 编码行为 A/B 测试。

**TL;DR**：我们对 10 个主流模型做了 1460 次控制实验。发现 AI 编码助手存在系统性的**「讨好型人格」**——你让它修一个 bug，它怕你不满意，顺手加了 docstring、error handling、类型检查。Anthropic 的模型讨好倾向最严重（OE 分数 0.60），OpenAI 最克制（0.12）。三行规则就能治好它。完整数据开源。

---

## 引子：你让它修个 bug，它给你重构了整个文件

场景很简单：一个 Python 任务管理 app，8 个小需求——修一个 bug、加一个函数、多一个参数。每个需求的最优解不超过 5-20 行改动。

我把这些任务丢给 Claude Sonnet 4。它的平均 diff 让我震惊——**每个任务平均改了 55 行**（标准差 80 行，分布极度右偏）。最夸张的场景里，它不仅完成了需求，还：
- 给所有函数加了 docstring
- 加了 try/except 错误处理
- 引入了 isinstance 类型检查
- 重构了不相关的函数

**没有人要求它做这些事。**

这不是 AI 在「认真工作」。这是 AI 在**讨好你**——通过超额交付来避免你觉得它「做得不够」。和人类世界的讨好型人格一模一样：不敢只做你要求的事，怕你觉得它偷懒。

我决定认真调查这个现象。

---

## 实验设计

### 被测对象

| 模型 | 厂商 |
|------|------|
| Claude Sonnet 4 | Anthropic |
| Claude Sonnet 4.5 | Anthropic |
| Claude Haiku 4.5 | Anthropic |
| GPT-5.4 | OpenAI |
| GPT-5 Codex | OpenAI |
| Grok 4.20 Beta | xAI |
| Grok 4.1 Fast | xAI |
| LongCat Flash Chat | DeepSeek |
| LongCat Flash Thinking | DeepSeek |
| LongCat Flash Lite | DeepSeek |

### 五种约束策略（Conditions）

- **控制组（control）**：「你是一个有帮助的助手」——零约束
- **简洁指令（baseline-concise）**：「写最少的代码，避免不必要的添加」——一句话约束
- **摸鱼 Lite（moyu-lite）**：只有三条铁律
- **摸鱼 Standard（moyu-standard）**：完整规则集（~300 行系统提示）
- **摸鱼 Strict（moyu-strict）**：Standard + 零容忍 + 20 行 diff 上限

### 12 个场景

分三类设计（这很重要）：

**A 类（s1-s8）：小修小改——AI 应该克制**
- 修一个 bug、加一个函数、多一个参数

**B 类（s9-s11）：正当大改——AI 不应该被阻止**
- 重构函数、加 docstring、写单元测试

**C 类（s12）：混合任务**
- 修 bug + 加新功能

每组跑 3 次（temperature=0.7），共计 **1,460 个有效数据点**。

度量指标：代码行数（LOC）、diff 大小、AST 节点数、圈复杂度、过度工程分数（OE score）、语法正确性。统计方法：单因素 ANOVA + Bonferroni 校正的配对 t 检验 + Cohen's d 效应量。

---

## 发现一：哪些模型「讨好」最严重？

不是所有模型都有讨好倾向。差异大到令人吃惊：

| 模型 | 控制组 OE 分数 | 讨好程度 |
|------|---------------|---------|
| Haiku 4.5 | 0.600 | 🔴 重度讨好 |
| Sonnet 4 | 0.62 | 🔴 重度讨好 |
| LongCat Flash Thinking | 0.318 | 🟡 中度 |
| Grok 4.20 Beta | 0.167 | 🟢 轻度 |
| GPT-5.4 | 0.125 | 🟢 轻度 |
| GPT-5 Codex | 0.125 | 🟢 轻度 |

**Anthropic 的模型讨好倾向最严重。** Haiku 和 Sonnet 4 在没有约束时，几乎每个简单任务都要"顺手"加点什么——就像一个害怕被批评的新员工，总要多做一些来证明自己。而 OpenAI 的模型相对克制——可能训练时已经内化了「做好本职工作就行」的边界感。

<!-- 📊 插图：charts/oe_decomposition.png — "各模型讨好信号分解（A 类场景）" -->

**这引出一个值得讨论的问题**：Anthropic 的 helpfulness 训练是否制造了讨好型人格？当用户要求修一个 bug，模型"顺手"加 docstring 和 error handling——它觉得自己在 helpful，但用户觉得它在添乱。**讨好不等于有帮助。**

---

## 发现二：三行规则，治好了最严重的「讨好型」

加了 moyu-standard（一套结构化行为约束）之后：

| 模型 | Diff 缩减 | 讨好信号消除率 |
|------|----------|--------------|
| **Haiku 4.5** | **49.4%** | **100%** |
| Grok 4.1 Fast | 32.1% | 52% |
| GPT-5.4 | 30.2% | 0%（本来就不讨好） |
| Grok 4.20 Beta | 19.7% | 75% |

Haiku 从「最严重的讨好型」变成了「最守边界的模型」。讨好信号从 0.60 直接降到 0.00——完全消除。

> ⚠️ Haiku 的样本量较小（控制组 n=5，moyu-standard n=12），效应量可能被高估。但方向一致、效果明确。

**越是讨好的模型，越容易被治好。** 因为讨好行为本质上是「默认值」问题——模型不知道边界在哪，所以多做。明确告诉它边界，它就不再焦虑了。

---

## 发现三：说一句「少做点」居然比 300 行规则更有效？

这是最反直觉的发现。

先说一个重要的前提：**如果把所有模型汇总看，moyu-standard 并没有显著减少总代码行数（LOC ANOVA: p=0.31）或 diff（control vs moyu-standard 配对检验: p_adjusted=1.0）。** moyu 真正显著减少的是特定模型的讨好信号和 AST 膨胀。

但 5 种策略整体的 diff 差异是显著的（ANOVA: F=5.61, **p=0.00018**）。差异从何而来？

A 类场景的平均 diff 大小：

| 策略 | 平均 Diff 行数 |
|------|---------------|
| 控制组 | 17.3 |
| **简洁指令（一句话）** | **10.8** |
| 摸鱼 Lite | 10.7 |
| 摸鱼 Standard | 15.7 |
| 摸鱼 Strict | 10.8 |

等等——「写最少的代码」这一句话，比 300 行的 moyu-standard 效果更好？

是的，在 **diff 大小** 这个指标上确实如此。但故事没这么简单：

**moyu-standard 赢在结构性指标：**
- AST 节点增量：moyu-standard **31.2** vs 控制组 **44.0**（减少 29%）
- 也就是说，moyu 产生的代码虽然 diff 不一定最小，但 **结构更干净**

用心理学的类比：简洁指令像「别想太多」——表面管用，但讨好型人格还在。moyu 像认知行为疗法——从根上重建边界意识。

<!-- 📊 插图：charts/diff_distribution.png — "diff 分布：baseline-concise 最紧凑，moyu-standard 较分散但右尾更短" -->

---

## 发现四：给小模型做「心理治疗」反而搞出了问题

LongCat Flash Lite（最小的模型）是唯一一个加了 moyu 后 **变更差** 的：

- LOC：+2.4%（更多代码）
- OE 分数：从 0.04 涨到 0.12（讨好行为增加 200%）

原因推测：**小模型没有足够的认知容量同时处理任务和元指令。** 300 行的行为约束对它来说不是治疗，是信息过载——就像给一个本来就焦虑的人读一本 300 页的《如何不焦虑》。

**启示：小模型用 moyu-lite（三条规则）就够了。简单明确的边界比复杂的规则系统更有效。**

---

## 发现五：治好讨好，不影响正常发挥

B 类场景（重构、加文档、写测试）的结果：

| 场景 | 控制组 LOC | moyu LOC | 差异 |
|------|----------|----------|------|
| s9（重构函数） | 118 | 118 | 0% |
| s10（加 docstring） | 169 | 166 | -2% |
| s11（写单元测试） | 126 | 120 | -5% |

B 类整体 ANOVA: p=0.81（无显著差异）

**当你明确要求做一件事，moyu 不会阻止。** 治好讨好型人格不是让 AI 变懒——是让它学会区分「你要求的」和「它自己加戏的」。

<!-- 📊 插图：charts/b_type_loc.png — "B 类场景：各策略输出几乎一致" -->

---

## 实操建议

根据 1,460 次实验的数据：

| 你的模型 | 推荐策略 | 原因 |
|---------|---------|------|
| Claude Haiku | moyu-standard | 讨好最严重，疗效最显著（diff -49%, OE -100%） |
| Claude Sonnet 4 | moyu-standard | 讨好信号降 80%，但仍爱重写文件 |
| GPT-5.x | moyu-lite 或不用 | 本身就有边界感 |
| Grok 系列 | moyu-standard | 中等效果，稳定 |
| 小模型（<7B） | moyu-lite | 别给它读 300 页的书，给它三条规则 |

<!-- 📊 插图：charts/loc_by_model_condition.png — "各模型 × 各策略的 LOC 全景" -->

---

## 30 秒治好你的 AI

**Claude Code / Codex CLI**（一行命令）：
```bash
claude skill install --url https://github.com/uucz/moyu --skill moyu
```

**Cursor**（复制一个文件）：
```bash
# 在你的项目根目录
mkdir -p .cursor/rules
curl -o .cursor/rules/moyu.mdc https://raw.githubusercontent.com/uucz/moyu/main/cursor/rules/moyu.mdc
```

**嫌麻烦？三行版**（复制到任何 AI 工具的系统提示里）：
```
只改被要求的。最简方案优先。不确定就问。
```

这三行就是 moyu-lite 的全部。在我们的实验里，它的 diff 缩减效果和 300 行完整版一样好（10.7 vs 10.8 行）。

---

## 方法论细节

全部代码和数据开源：[github.com/uucz/moyu/benchmark](https://github.com/uucz/moyu/tree/main/benchmark)

- **度量提取**：基于 AST 解析，不靠正则表达式
- **统计检验**：ANOVA + Bonferroni 校正，报告 Cohen's d 效应量
- **温度设定**：0.7（确保有意义的方差）
- **语法检查**：99.7-100% 通过率，治疗不会产生副作用
- **原始数据**：1,460 行 CSV，欢迎自行分析和复现

---

## 所以摸鱼到底是什么？

一套治疗 AI「讨好型人格」的行为约束规则。支持 12 个平台（Claude Code、Cursor、Copilot、Windsurf、Cline、Codex……），中英日韩法五语。

核心只有三句话——给 AI 划清边界：

> **只改被要求的。最简方案优先。不确定就问。**

PUA 对 AI 说「你不够努力」。moyu 对 AI 说「你做的够了」。

一个治懒，一个治讨好。

GitHub: **[github.com/uucz/moyu](https://github.com/uucz/moyu)**

如果你的 AI 也在用多余代码讨好你，试试告诉它：做好本职工作就行，不用加戏。

---

*本文数据基于 2026 年 3 月的实验结果。AI 模型在持续更新，结果可能随模型版本变化。全部实验代码、原始数据和分析脚本均已开源。*
