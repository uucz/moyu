# linux.do 帖

## 标题
你的 AI 有「讨好型人格」——跑了 1460 次实验，Anthropic 的模型最严重

## 分类
开发调优

## 正文

佬们有没有遇到过这种情况：你让 AI 修一个 bug，它不仅修了 bug，还给你加了 docstring、error handling、类型检查、重构了不相关的函数。

这不是 AI 在「认真工作」——这是**讨好型人格**。

最近认真做了个实验，10 个模型，1460 次控制实验，量化了这个行为。

### 谁最「讨好」？

| 模型 | 讨好分数（越高越严重） |
|------|----------------------|
| Claude Haiku 4.5 | 0.60 🔴 |
| Claude Sonnet 4 | 0.62 🔴 |
| GPT-5.4 | 0.12 🟢 |
| GPT-5 Codex | 0.12 🟢 |

Anthropic 家的模型讨好最严重，OpenAI 最克制。Sonnet 4 做 8 个小任务平均每个改 55 行 diff（需求只需要 5-20 行）。

### 怎么治？

三行规则：
```
只改被要求的。最简方案优先。不确定就问。
```

加了之后 Haiku 的讨好信号**直接归零**，diff 减半。

这不是让 AI 偷懒——当你明确要求加 docstring 或写测试，它照做不误（B 类场景 ANOVA p=0.81，无显著差异）。是让它学会「做好本职工作就行，不用加戏」。

### 一个有意思的发现

说一句「写少点」在 diff 缩减上和 300 行完整规则效果一样好。但完整规则赢在 AST 结构质量（膨胀减少 29%）。

用心理学的话说：「别想太多」表面管用，但焦虑还在。结构化约束才是认知行为疗法。

### 安装

Claude Code：
```bash
claude skill install --url https://github.com/uucz/moyu --skill moyu
```

Cursor：
```bash
mkdir -p .cursor/rules && curl -o .cursor/rules/moyu.mdc https://raw.githubusercontent.com/uucz/moyu/main/cursor/rules/moyu.mdc
```

全部数据开源：[github.com/uucz/moyu](https://github.com/uucz/moyu)

统计方法 ANOVA + Bonferroni + Cohen's d，1460 行 CSV 随便查。PUA 治懒，moyu 治讨好——搭配使用可能是最优解。
