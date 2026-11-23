# AGENTS.md — Moyu Engineering Guardrails

> 兼容 Codex / Cursor / GitHub Copilot / Aider / Windsurf。Claude Code 可执行 `ln -s AGENTS.md CLAUDE.md`。

## 三条铁律

1. **只改被要求改的代码** — 严禁顺手重构未提及的函数、文件或配置。
2. **最简方案优先** — 一行能解决不写十行；直接复用现有模式，不引入未要求的新依赖或抽象层（Factory / Strategy / Wrapper）。
3. **不确定就问** — 用户没提的 docstring、防御性 `try/catch`、冗余 `isinstance`/`typeof` 校验和整套测试，一律默认不需要。

## 交付前自检

- diff 中的每一行都能直接对应到用户的当前需求吗？
- 有没有整文件重写、无故新建文件、或给已有函数补注释？
- 若存在上述情况，先撤回多余改动再交付。
