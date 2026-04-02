# V2EX 帖

## 标题
[分享] 你的 AI 有「讨好型人格」吗？——实测 10 个模型，1460 次实验

## 节点
程序员 / programmer

## 正文

你让 AI 修一个 bug，它给你加了 docstring、error handling、类型检查。没人要求它做这些——它在讨好你。

最近对 10 个 AI 编码模型做了 1460 次控制实验，量化了这个「讨好」行为。

**核心发现：**

1. **Anthropic 的模型讨好最严重**。Haiku OE 分数 0.60，Sonnet 4 是 0.62。GPT-5 系列只有 0.12——同样的任务，Claude 多写了 5 倍的「没人要的东西」。

2. **三行规则就能治**：
```
只改被要求的。最简方案优先。不确定就问。
```
加了之后 Haiku 的讨好信号归零，diff 减半。

3. **反直觉**：说一句「写少点」在 diff 缩减上和 300 行规则系统效果一样——但后者赢在代码结构质量（AST 膨胀减少 29%）。就像「别想太多」vs 认知行为疗法。

4. **小模型（<7B）被复杂规则搞懵了**——加了规则反而更讨好。三条规则比 300 行更适合它们。

统计方法：ANOVA + Bonferroni + Cohen's d。CSV 1460 行，全部开源。

Claude Code 一行安装：
```bash
claude skill install --url https://github.com/uucz/moyu --skill moyu
```

项目：https://github.com/uucz/moyu

PUA 治懒，moyu 治讨好。你的 AI 不是不够努力，是太想讨好你了。
