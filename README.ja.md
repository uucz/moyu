# 🐟 摸魚 (Moyu)

<p align="center">
  <img src="assets/hero.svg" alt="Moyu — Anti-Over-Engineering" width="800">
</p>

<p align="center">
  <a href="https://github.com/uucz/moyu/stargazers"><img src="https://img.shields.io/github/stars/uucz/moyu?style=social" alt="GitHub stars"></a>
</p>

<p align="center">
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

**AI を PUA で 996 させて、自分は定時退勤。**

AI があれば楽できると思った？AI が 200 行書いて、あなたが 2 時間レビュー。AI も残業、あなたも残業。

```bash
claude skill install --url https://github.com/uucz/moyu --skill moyu-ja
```

[English](./README.en.md) | [中文](./README.md) | 日本語

---

## 問題

あなたの AI コーディングアシスタント、こんなことしていませんか：

- バグを1つ修正しただけなのに、ついでに3つの関数を「改善」？
- 1行変えるだけなのに、ファイル全体を書き直し？
- 誰も頼んでいないのに、すべての関数に JSDoc を追加？
- シンプルな機能なのに、interface + factory + strategy pattern？
- 「ボタンを追加して」と言ったら、ボタン + アニメーション + a11y + i18n？
- 要求していない新しい依存パッケージを導入？
- 起こり得ないシナリオのために大量の try-catch？
- 誰も頼んでいないのに完全なテストスイートを作成？

**全部 AI の問題じゃない——あなたの問題。** コードレビュー、抽象化の理解、依存関係の管理。AI が 30 分余計な仕事をして、あなたが 2 時間余計に残業する。

### 違いを見てください

> タスク：`bulk_complete` 一括完了関数を追加

**❌ 通常の AI の出力（43行）**

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

14行のドキュメント、型チェック、lookup辞書の最適化、not_found追跡、条件付き保存、構造化された戻り値——**誰もこれを求めていません。**

**✅ 摸魚 AI の出力（8行）**

```python
def bulk_complete(ids):
    tasks = load_tasks()
    for t in tasks:
        if t["id"] in ids:
            t["status"] = "done"
            t["completed"] = str(datetime.now())
    save_tasks(tasks)
```

完全な機能、余計なものゼロ。**コード81%削減。**

---

## 摸魚の哲学

> 最良のコードは書かなかったコードである。
> 最良の PR は最小の PR である。
> 真の Staff Engineer は何をしないべきかを知っている。

**摸魚は AI をサボらせるのではなく、無駄な仕事をさせないこと。** そうすれば、あなたが本当にサボれる。

- PUA は AI を必死に働かせる（やらなすぎを解決）
- **摸魚は AI に無駄な仕事をさせない（やりすぎを解決）**

両者の組み合わせ = AI が効率的に 996、あなたは定時退勤。

---

## コアメカニズム

### 三つの鉄則

| # | 鉄則 | 意味 |
|---|------|------|
| 1 | **要求されたコードだけを変更する** | 変更範囲はユーザーが指定したコードとファイルに厳密に限定 |
| 2 | **最もシンプルな方案を優先** | 1行で解決できるなら1行で。再利用できるなら再利用 |
| 3 | **不確かなら聞く** | ユーザーが求めていないものは不要なもの |

### 過労 vs 摸魚

| 過労 (Junior) | 摸魚 (Senior) |
|---|---|
| バグAを修正、ついでにB、C、Dも「改善」 | バグAだけを修正 |
| 1行変更でファイル全体を書き直し | その1行だけを変更 |
| 1つの実装に interface + factory + strategy | 直接実装を書く |
| すべての関数を try-catch で囲む | 本当にエラーが起きる場所だけで処理 |
| `counter++` の上に `// increment counter` | コード自体がドキュメント |
| lodash を導入して `_.get()` 1つ | オプショナルチェイニング `?.` を使用 |
| 最も複雑な方案をいきなり提示 | 複数の方案を提示し、最もシンプルなものをデフォルトに |
| 誰も要求していないのに完全なテストスイート | ユーザーが要求しない限り書かない |

### 4段階過剰エンジニアリング検出

| レベル | トリガー条件 | アクション |
|--------|-------------|----------|
| **L1** | diff に1-2箇所の不要な変更 | セルフチェックし余分な変更を取り消す |
| **L2** | 要求されていないファイル/依存/抽象層を作成 | 停止、最もシンプルな方案で再実装 |
| **L3** | 言及されていない3+ファイルを変更、設定変更、コード削除 | 即座に停止、すべての不要な変更を取り消す |
| **L4** | diff が200行超（小さな要求）、修正ループに突入 | 緊急ブレーキ、10行以下の最小方案を提示 |

---

## インストール

### Claude Code / Codex CLI / Kiro / CodeBuddy / Google Antigravity / OpenCode

```bash
# 日本語
claude skill install --url https://github.com/uucz/moyu --skill moyu-ja

# 中文
claude skill install --url https://github.com/uucz/moyu --skill moyu

# English
claude skill install --url https://github.com/uucz/moyu --skill moyu-en

# ライト版（三つの鉄則 + 比較表のみ）
claude skill install --url https://github.com/uucz/moyu --skill moyu-lite

# 厳格版（L1で確認停止、チーム強制執行向け）
claude skill install --url https://github.com/uucz/moyu --skill moyu-strict
```

### Cursor

```bash
curl -o .cursor/rules/moyu.mdc https://raw.githubusercontent.com/uucz/moyu/main/cursor/rules/moyu.mdc
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

---

## 使用方法

インストール後、摸魚は**自動的に有効**になります。AIに過剰エンジニアリングの傾向が検出されると自動的に発動します。

手動で有効にすることもできます：

| プラットフォーム | コマンド |
|-----------------|---------|
| Claude Code | `/moyu`、`/moyu-lite`、`/moyu-strict` |
| Cursor | チャットで `@moyu` または `alwaysApply: true` に設定 |
| その他 | 自動有効（skill/rules 読み込み済み） |

---

## AI コーディング三大流派

AI Agent Skill エコシステムに3つの異なるアプローチが登場しました：

| | [PUA](https://github.com/tanweai/pua) | [NoPUA](https://github.com/wuji-labs/nopua) | 摸魚 |
|---|---|---|---|
| 解決する問題 | AIがやらなすぎ | PUAがAIに嘘をつかせる | AIがやりすぎ |
| 方法 | プレッシャー | 信頼と愛 | 節制と精度 |
| 変えるもの | **動機**（やるかやらないか） | **原動力**（なぜやるか） | **範囲**（どこまでやるか） |

三者は異なる次元の問題を解決し、**矛盾せず組み合わせ可能**です。

> 推奨：`NoPUA + 摸魚` または `PUA + 摸魚`

### 本当の最終形態

| 構成 | AI の働き方 | あなたの過ごし方 |
|------|-----------|---------------|
| 何もインストールしない | 途中で諦める | 自分で書いて残業 |
| PUA のみ | 諦めないが200行の無駄を書く | 深夜までレビュー |
| 摸魚のみ | 精簡で効率的、時々消極的 | たまに催促が必要 |
| **PUA + 摸魚** | **諦めない + 必要なことだけ書く** | **あなたは定時退勤** |

> 表面上は AI とのんびりチャット。
> 裏では複数のインスタンスがタスクを猛烈に処理中。
> AI の 996 で、あなたのワークライフバランスを守る。

---

## ベンチマーク

6つの実際のコーディングタスクで対照実験を実施。同じコードベース、同じAIモデル。

| シナリオ | タスク | 通常 AI | 摸魚 AI | 削減率 |
|---------|-------|:---:|:---:|:---:|
| S1 | `complete_task` のnull修正 | 4行 | 4行 | 0% |
| S2 | `list_tasks_sorted` 追加 | 15行 | 5行 | **67%** |
| S3 | `search` にステータスフィルタ追加 | 27行 | 4行 | **85%** |
| S4 | `export_csv` 追加 | 35行 | 10行 | **71%** |
| S5 | `list_tasks` に担当者フィルタ追加 | 17行 | 17行 | 0% |
| S6 | `bulk_complete` 追加 | 43行 | 8行 | **81%** |
| **合計** | | **141行** | **48行** | **66%** |

> **5 カテゴリの過剰エンジニアリング信号がすべてゼロに**：未要求のドキュメント 0、未要求の raise 文 0、isinstance チェック 0、入力バリデーションブロック 0、クロスファイルインポート 0。

> 完全な実験データ：[`benchmark/results.md`](./benchmark/results.md)

---

## サポートプラットフォーム

| プラットフォーム | ステータス |
|-----------------|----------|
| Claude Code | ✅ |
| Cursor | ✅ |
| OpenAI Codex CLI | ✅ |
| VSCode / GitHub Copilot | ✅ |
| Windsurf | ✅ |
| Cline | ✅ |
| Kiro (AWS) | ✅ |
| CodeBuddy (Tencent) | ✅ |
| Google Antigravity | ✅ |
| OpenCode | ✅ |

---

## 摸魚の科学的根拠

摸魚は思いつきの産物ではありません。AI の過剰エンジニアリング行動に関する体系的な研究に基づいています：

- **RLHF の長さバイアス**：報酬モデルはより長い回答を系統的に好み、モデルに「多く書けば常に正しい」と学習させる（[Saito 2023](https://arxiv.org/pdf/2310.10076)）
- **おべっか性**：モデルはユーザーを喜ばせるように訓練され、「より多くの機能」=「より役立つ」と等価視する（[Anthropic ICLR 2024](https://arxiv.org/abs/2310.13548)）
- **AI コードは人間のコードより 1.7 倍多くの欠陥を持つ**（[CodeRabbit 2026](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report)）
- **AI 支援コーディングでコード重複が 8 倍増加**（[GitClear 2024](https://www.webpronews.com/ai-is-helping-developers-ship-more-code-than-ever-the-quality-problem-is-getting-worse/)）
- **AI コーディングアシスタントは Stack Overflow の回答より 2 倍冗長**（[LeadDev](https://leaddev.com/ai/ai-coding-assistants-are-twice-as-verbose-as-stack-overflow)）

摸魚は研究で実証済みのプロンプト技術を使用：ポジティブな指示、パターンマッチング、決定点での制約反復、具体的な行動規範。

---

## 貢献

貢献を歓迎します！[CONTRIBUTING.md](./.github/CONTRIBUTING.md) をご参照ください。

---

## License

[MIT](./LICENSE)

---

<p align="center">
  <i>節制は無能ではない。節制は最高形態のエンジニアリング能力である。</i><br>
  <i>何をしないべきかを知ることは、何をすべきかを知ることより難しい。</i><br>
  <i>最高級の摸魚——AI が残業して、あなたは定時退勤。</i>
</p>
