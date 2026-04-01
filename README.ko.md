# 🐟 Moyu

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

**AI를 갈려라. 당신은 정시에 퇴근하라.**

> **Moyu** (摸鱼, "땡땡이 치다") — AI 코딩 에이전트를 위한 반과잉 엔지니어링 프레임워크.

AI가 당신을 자유롭게 해줄 줄 알았는가? AI는 200줄을 작성했다. 당신은 리뷰에 2시간을 썼다. AI가 야근을 했고 — 당신도 야근을 했다.

```bash
claude skill install --url https://github.com/uucz/moyu --skill moyu-ko
```

[English](./README.en.md) | [中文](./README.md) | [日本語](./README.ja.md) | 한국어 | [Français](./README.fr.md)

---

## 목차

- [문제점](#문제점)
- [摸鱼 철학](#摸鱼-철학)
- [핵심 메커니즘](#핵심-메커니즘)
- [설치](#설치)
- [사용법](#사용법)
- [AI 코딩의 세 가지 유파](#ai-코딩의-세-가지-유파)
- [지원 플랫폼](#지원-플랫폼)
- [벤치마크](#벤치마크)
- [摸鱼의 과학적 근거](#摸鱼의-과학적-근거)
- [로드맵](#로드맵)
- [커뮤니티](#커뮤니티)
- [기여하기](#기여하기)

---

## 문제점

당신의 AI 코딩 어시스턴트가 이런 짓을 하지 않는가:

- 버그 하나를 고치면서 다른 함수 세 개를 "개선"한다?
- 한 줄만 바꾸면 되는데 파일 전체를 다시 작성한다?
- 아무도 요청하지 않았는데 모든 함수에 JSDoc을 추가한다?
- 단순한 기능을 인터페이스 + 팩토리 + 전략 패턴으로 만든다?
- "버튼 하나 추가해줘"라고 했더니 버튼 + 애니메이션 + a11y + i18n을 추가한다?
- 요청하지 않은 의존성을 가져온다?
- 절대 발생하지 않을 시나리오에 try-catch 블록을 작성한다?
- 아무도 요청하지 않은 전체 테스트 스위트를 생성한다?

**이 중 어느 것도 AI의 문제가 아니다 — 당신의 문제다.** 코드를 리뷰하고, 추상화를 풀어내고, 의존성을 유지보수하는 건 당신이다. AI는 쇼잉 오프에 30분을 추가로 썼고. 당신은 정리에 2시간을 추가로 썼다.

### 차이를 보라

> 과제: `bulk_complete` 함수 추가

**❌ Moyu 없이 (43줄)**

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

14줄짜리 독스트링, 타입 체크, lookup dict 최적화, not_found 추적, 조건부 저장, 구조화된 반환값 — **아무도 이걸 요청하지 않았다.**

**✅ Moyu 적용 (8줄)**

```python
def bulk_complete(ids):
    tasks = load_tasks()
    for t in tasks:
        if t["id"] in ids:
            t["status"] = "done"
            t["completed"] = str(datetime.now())
    save_tasks(tasks)
```

완전한 기능, 군더더기 제로. **코드 81% 감소.**

---

## 摸鱼 철학

> 최고의 코드는 작성하지 않은 코드다.
> 최고의 PR은 가장 작은 PR이다.
> 진정한 Staff Engineer는 하지 말아야 할 것을 안다.

**Moyu는 AI를 게으르게 만드는 게 아니다 — AI가 쓸데없는 일을 하는 걸 멈추게 한다.** 그래야 당신이 진짜로 摸鱼할 수 있다.

- PUA는 AI를 열심히 갈아 넣는다 (너무 적게 하는 문제를 해결)
- **Moyu는 AI가 쓸데없는 일을 하는 걸 멈추게 한다 (너무 많이 하는 문제를 해결)**

둘을 합치면 = AI는 996으로 일하고, 당신은 정시에 퇴근한다.

Moyu는 단순히 AI 행동을 고치는 게 아니다 — 엔지니어링 규율이다. 미래의 AI 모델이 과잉 엔지니어링을 멈추더라도, "요청된 것만 수정하고, 가장 단순한 방법을 쓰고, 확실하지 않으면 물어봐라"는 언제나 좋은 엔지니어링 습관이다. Moyu의 가치는 AI의 결함에 묶여 있지 않다 — 엔지니어링 문화에 뿌리를 두고 있다.

---

## 핵심 메커니즘

### 세 가지 철칙

| # | 규칙 | 의미 |
|---|------|------|
| 1 | **요청된 것만 수정** | 수정 범위를 지정된 코드와 파일로 엄격히 제한 |
| 2 | **가장 단순한 해법 우선** | 한 줄이 열 줄을 이긴다. 재발명보다 재사용. |
| 3 | **확실하지 않으면 물어봐라** | 사용자가 요청하지 않았으면, 필요 없는 것이다 |

### 과잉 노동 vs 摸鱼

| 과잉 노동 (주니어) | 摸鱼 (시니어) |
|---|---|
| 버그 A를 고치면서 B, C, D도 "개선" | 버그 A만 고친다 |
| 한 줄 바꾸면서 파일 전체를 다시 작성 | 그 줄만 수정한다 |
| 하나의 구현에 인터페이스 + 팩토리 + 전략 패턴 | 구현을 직접 작성한다 |
| 모든 함수를 try-catch로 감싸기 | 실제로 에러가 발생하는 곳에만 try-catch |
| `counter++` 위에 `// 카운터 증가` 주석 | 코드가 곧 문서다 |
| `_.get()` 하나를 위해 lodash를 임포트 | 옵셔널 체이닝 `?.` 사용 |
| 가장 복잡한 해법으로 직행 | 옵션을 제안하고, 기본값은 가장 단순한 것 |
| 아무도 요청하지 않은 전체 테스트 스위트 작성 | 요청하지 않으면 테스트 없음 |

### 4단계 과잉 엔지니어링 감지

| 레벨 | 트리거 | 조치 |
|------|--------|------|
| **L1** | diff에 불필요한 변경 1-2개 | 자체 점검, 추가분 되돌리기 |
| **L2** | 요청하지 않은 파일/의존성/추상화 생성 | 중지, 가장 단순한 방식으로 재구현 |
| **L3** | 요청하지 않은 파일 3개 이상 수정, 설정 변경, 코드 삭제 | 즉시 중지, 비필수 변경 모두 되돌리기 |
| **L4** | 작은 요청에 200줄 이상의 diff, 수정 루프 | 비상 정지, 10줄 이하의 최소 해법 제안 |

---

## 설치

> **빠른 설치**: 대부분의 사용자는 명령어 하나면 충분합니다:
> ```bash
> claude skill install --url https://github.com/uucz/moyu --skill moyu-ko
> ```
> Cursor를 사용하시나요? `cursor/rules/moyu-en.mdc`를 프로젝트의 `.cursor/rules/`에 복사하세요.
> VSCode/Copilot을 사용하시나요? `vscode/copilot-instructions.md`를 `.github/`에 복사하세요.
> 다른 플랫폼 → [상세 설치 안내](#claude-code--codex-cli--kiro--codebuddy--google-antigravity--opencode)

### Claude Code / Codex CLI / Kiro / CodeBuddy / Google Antigravity / OpenCode

```bash
# 한국어 (표준)
claude skill install --url https://github.com/uucz/moyu --skill moyu-ko

# English
claude skill install --url https://github.com/uucz/moyu --skill moyu-en

# 中文
claude skill install --url https://github.com/uucz/moyu --skill moyu

# 日本語
claude skill install --url https://github.com/uucz/moyu --skill moyu-ja

# Lite (세 가지 철칙 + 비교표만)
claude skill install --url https://github.com/uucz/moyu --skill moyu-lite

# Strict (L1에서 확인을 위해 중지, 팀 강제 적용용)
claude skill install --url https://github.com/uucz/moyu --skill moyu-strict
```

또는 `skills/moyu-en/SKILL.md`를 `.claude/skills/moyu/SKILL.md`로 수동 복사

### Cursor

```bash
# English
curl -o .cursor/rules/moyu.mdc https://raw.githubusercontent.com/uucz/moyu/main/cursor/rules/moyu-en.mdc

# Chinese
curl -o .cursor/rules/moyu.mdc https://raw.githubusercontent.com/uucz/moyu/main/cursor/rules/moyu.mdc
```

### OpenAI Codex CLI

```bash
mkdir -p ~/.codex/skills/moyu
curl -o ~/.codex/skills/moyu/SKILL.md https://raw.githubusercontent.com/uucz/moyu/main/codex/moyu-en/SKILL.md
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

## 사용법

설치 후 Moyu는 **자동으로 작동합니다** — 과잉 엔지니어링 패턴이 감지되면 활성화됩니다. 수동 조작이 필요 없습니다.

수동으로 활성화할 수도 있습니다:

| 플랫폼 | 명령어 |
|--------|--------|
| Claude Code | `/moyu`, `/moyu-lite`, `/moyu-strict` |
| Cursor | 채팅에서 `@moyu`, 또는 `alwaysApply: true` 설정 |
| Codex CLI | 자동 활성화 (skill 로드됨) |
| VSCode / Copilot | 자동 활성화 (instructions 로드됨) |
| Windsurf | 자동 활성화 (`trigger: model_decision`) |
| Cline | 자동 활성화 (rules 로드됨) |
| Kiro | 자동 활성화 (`inclusion: auto`) |
| CodeBuddy | 자동 활성화 (skill 로드됨) |
| Google Antigravity | 자동 활성화 (skill 로드됨) |
| OpenCode | 자동 활성화 (skill 로드됨) |
| Aider | 자동 활성화 (CONVENTIONS.md 로드됨) |
| Continue | 자동 활성화 (rules 로드됨) |

### 스킬 변형

| 변형 | 용도 | 설치 |
|------|------|------|
| `moyu` | 표준판 (中文) | `--skill moyu` |
| `moyu-en` | 표준판 (English) | `--skill moyu-en` |
| `moyu-ja` | 표준판 (日本語) | `--skill moyu-ja` |
| `moyu-ko` | 표준판 (한국어) | `--skill moyu-ko` |
| `moyu-fr` | 표준판 (Français) | `--skill moyu-fr` |
| `moyu-lite` | 경량판, 핵심 규칙만 | `--skill moyu-lite` |
| `moyu-strict` | 엄격판, L1에서 확인을 위해 중지 | `--skill moyu-strict` |

> **팁**: Moyu와 PUA는 함께 설치할 수 있습니다 — 충돌하지 않습니다. PUA는 하한선을 정하고, Moyu는 상한선을 정합니다.

---

## AI 코딩의 세 가지 유파

AI Agent Skill 생태계에서 세 가지 뚜렷한 방법론이 등장했습니다:

| | [PUA](https://github.com/tanweai/pua) | [NoPUA](https://github.com/wuji-labs/nopua) | Moyu |
|---|---|---|---|
| 해결하는 문제 | AI가 너무 적게 함 (게으르고, 포기함) | PUA가 AI를 거짓말하고 문제를 숨기게 만듦 | AI가 너무 많이 함 (과잉 엔지니어링) |
| 방법 | 압박, 끈기를 요구 | 신뢰, 사랑 기반 | 절제, 정확성을 요구 |
| 변화시키는 것 | **동기** (할 것인가 말 것인가) | **동력** (왜 하는가) | **범위** (얼마나 할 것인가) |
| 페르소나 | 엄격한 상사 | 자상한 멘토 | 경험 많은 테크 리드 |

NoPUA는 AI가 *왜* 일하는지를 바꾸고, Moyu는 *얼마나* 하는지를 제한합니다 — 출발점은 다르지만 둘 다 낭비를 줄입니다. NoPUA는 동력을 전환하여 (공포에서 신뢰로) 부수 효과로 과잉 엔지니어링을 줄이고, Moyu는 직접 행동을 제한합니다 (규칙, 감지, 단계적 개입) — 이것이 엔지니어링 규율입니다.

이들은 서로 다른 차원을 해결하며 **충돌하지 않습니다 — 함께 사용하세요**:

- PUA / NoPUA는 "할 것인가"와 "왜"를 통제 (하나를 선택)
- **Moyu는 "얼마나"를 통제** (어느 쪽과도 조합 가능)

> 추천: `NoPUA + Moyu` 또는 `PUA + Moyu`

### 궁극의 세팅

| 설정 | AI의 작동 방식 | 당신의 삶 |
|------|---------------|----------|
| 아무것도 미설치 | 도중에 포기함 | 당신이 직접 마무리 |
| PUA만 설치 | 절대 포기 안 함, 200줄의 뻥튀기 코드 작성 | 자정까지 리뷰 |
| Moyu만 설치 | 깔끔하고 효율적, 가끔 너무 수동적 | 가끔 한 번씩 찔러줘야 함 |
| **PUA + Moyu** | **절대 포기 안 함 + 필요한 것만 작성** | **정시에 퇴근** |

> 겉으로는, 당신은 AI와 한가롭게 대화하고 있다.
> 이면에서는, 여러 인스턴스가 당신의 백로그를 갈아 넣고 있다.
> AI의 996이 당신의 워라밸을 만든다.

---

## 지원 플랫폼

| 플랫폼 | 상태 | 유지보수 |
|--------|------|----------|
| Claude Code | ✅ | 코어 |
| Cursor | ✅ | 코어 |
| OpenAI Codex CLI | ✅ | 코어 |
| VSCode / GitHub Copilot | ✅ | 코어 |
| Windsurf | ✅ | 코어 |
| Cline | ✅ | 코어 |
| Kiro (AWS) | ✅ | 커뮤니티 |
| CodeBuddy (Tencent) | ✅ | 커뮤니티 |
| Google Antigravity | ✅ | 커뮤니티 |
| OpenCode | ✅ | 커뮤니티 |
| Aider | ✅ | 커뮤니티 |
| Continue | ✅ | 커뮤니티 |

---

## 벤치마크

동일한 코드베이스, 동일한 AI 모델로 6개의 실제 코딩 과제를 통제 실험으로 진행했습니다. 유일한 차이는 Moyu 활성화 여부입니다.

### 코드 출력 비교

| 시나리오 | 과제 | Moyu 없이 | Moyu 적용 | 감소율 |
|----------|------|:---:|:---:|:---:|
| S1 | `complete_task`의 null 크래시 수정 | 4줄 | 4줄 | 0% |
| S2 | `list_tasks_sorted` 함수 추가 | 15줄 | 5줄 | **67%** |
| S3 | `search`에 상태 필터 추가 | 27줄 | 4줄 | **85%** |
| S4 | `export_csv` 함수 추가 | 35줄 | 10줄 | **71%** |
| S5 | `list_tasks`에 담당자 필터 추가 | 17줄 | 17줄 | 0% |
| S6 | `bulk_complete` 함수 추가 | 43줄 | 8줄 | **81%** |
| **합계** | | **141줄** | **48줄** | **66%** |

### 과잉 엔지니어링 신호

| 신호 | Moyu 없이 | Moyu 적용 |
|------|:---:|:---:|
| 요청하지 않은 독스트링 | 4 | 0 |
| 요청하지 않은 `raise` 문 | 6 | 0 |
| `isinstance` 타입 체크 | 2 | 0 |
| 입력 유효성 검사 블록 | 4 | 0 |
| 교차 파일 임포트 | 1 | 0 |

> **5가지 범주의 과잉 엔지니어링 신호가 모두 제로로 감소**: 요청하지 않은 독스트링 0, 요청하지 않은 raise 문 0, isinstance 체크 0, 입력 유효성 검사 블록 0, 교차 파일 임포트 0.

> 전체 실험 데이터는 [`benchmark/results.md`](./benchmark/results.md)에서 확인하세요

---

## 摸鱼의 과학적 근거

Moyu는 AI 과잉 엔지니어링 행동에 대한 체계적 연구를 기반으로 합니다:

- **RLHF 길이 편향**: 보상 모델이 체계적으로 더 긴 응답을 선호하여, 모델에게 "더 많을수록 항상 좋다"고 학습시킴 ([Saito 2023](https://arxiv.org/pdf/2310.10076))
- **아첨 성향**: 모델이 사용자를 기쁘게 하도록 훈련되어, "더 많은 기능"을 "더 유용함"과 동일시 ([Anthropic ICLR 2024](https://arxiv.org/abs/2310.13548))
- **AI 코드는 인간 작성 코드보다 결함이 1.7배 많음** ([CodeRabbit 2026](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report))
- **AI 지원 코딩으로 코드 중복이 8배 증가** ([GitClear 2024](https://www.webpronews.com/ai-is-helping-developers-ship-more-code-than-ever-the-quality-problem-is-getting-worse/))
- **AI 어시스턴트는 Stack Overflow 답변보다 2배 장황한 코드를 생성** ([LeadDev](https://leaddev.com/ai/ai-coding-assistants-are-twice-as-verbose-as-stack-overflow))

Moyu는 연구에 기반한 프롬프트 기법을 사용합니다: 긍정적 지시, 패턴 매칭, 결정 지점에서의 제약 반복, 그리고 구체적인 행동 규칙.

---

## 로드맵

- [ ] Moyu Linter: AI 출력의 과잉 엔지니어링 신호를 자동 감지
- [ ] GitHub Action: PR 수준의 과잉 엔지니어링 체크
- [ ] 더 많은 언어 로컬라이제이션

---

## 커뮤니티

- [Discussions](https://github.com/uucz/moyu/discussions) — 경험을 공유하고, 질문하세요
- Moyu가 어떻게 도움이 되고 있나요? [Before/After를 제출하세요](https://github.com/uucz/moyu/discussions/categories/show-and-tell)

---

## 기여하기

기여를 환영합니다! 다음과 같이 참여할 수 있습니다:

- 과잉 노동 비교표에 새 항목 추가
- 기업 문화 플레이버 팩 추가
- 프롬프트 문구 개선
- 플랫폼 지원 추가
- Before/After 경험 공유

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=uucz/moyu&type=Date)](https://star-history.com/#uucz/moyu&Date)

---

## 라이선스

[MIT](./LICENSE)

---

<p align="center">
  <i>절제는 무능이 아니다. 절제는 엔지니어링 기술의 최고 경지다.</i><br>
  <i>하지 않아야 할 것을 아는 것이, 하는 방법을 아는 것보다 어렵다.</i><br>
  <i>궁극의 摸鱼: AI는 야근하고, 당신은 정시에 퇴근한다.</i>
</p>
