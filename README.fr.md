# 🐟 Moyu

<p align="center">
  <img src="assets/hero.svg" alt="Moyu — Anti-Sur-Ingénierie" width="800">
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

**Faites bosser votre IA. Pour que vous n'ayez pas à le faire.**

> **Moyu** (摸鱼, "tirer au flanc") — un framework anti-sur-ingénierie pour les agents de code IA.

Vous pensiez que l'IA allait vous libérer ? Elle a écrit 200 lignes. Vous avez passé 2 heures à relire. L'IA a fait des heures sup — et vous aussi.

```bash
claude skill install --url https://github.com/uucz/moyu --skill moyu-fr
```

[English](./README.en.md) | [中文](./README.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | Français

---

## Table des matières

- [Le problème](#le-problème)
- [La philosophie Moyu](#la-philosophie-moyu)
- [Mécanismes clés](#mécanismes-clés)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Trois écoles du codage IA](#trois-écoles-du-codage-ia)
- [Plateformes supportées](#plateformes-supportées)
- [Benchmark](#benchmark)
- [La science derrière Moyu](#la-science-derrière-moyu)
- [Feuille de route](#feuille-de-route)
- [Communauté](#communauté)
- [Contribuer](#contribuer)

---

## Le problème

Est-ce que votre assistant IA de codage fait ça :

- Corriger un bug, puis « améliorer » trois autres fonctions au passage ?
- Modifier une ligne, mais réécrire le fichier entier ?
- Ajouter des JSDoc à chaque fonction sans qu'on le demande ?
- Transformer une fonctionnalité simple en interface + factory + strategy pattern ?
- Vous dites « ajoute un bouton », il ajoute bouton + animation + a11y + i18n ?
- Importer des dépendances que vous n'avez pas demandées ?
- Écrire des blocs try-catch pour des scénarios qui ne peuvent jamais arriver ?
- Générer une suite de tests complète que personne n'a demandée ?

**Rien de tout ça n'est le problème de l'IA — c'est le vôtre.** C'est vous qui relisez le code, démêlez les abstractions, maintenez les dépendances. L'IA a passé 30 minutes de plus à frimer. Vous avez passé 2 heures de plus à nettoyer.

### Voyez la différence

> Tâche : Ajouter une fonction `bulk_complete`

**❌ Sans Moyu (43 lignes)**

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

Docstring de 14 lignes, vérification de types, optimisation par dictionnaire, suivi des non-trouvés, sauvegarde conditionnelle, valeur de retour structurée — **personne n'a demandé tout ça.**

**✅ Avec Moyu (8 lignes)**

```python
def bulk_complete(ids):
    tasks = load_tasks()
    for t in tasks:
        if t["id"] in ids:
            t["status"] = "done"
            t["completed"] = str(datetime.now())
    save_tasks(tasks)
```

Fonctionnalité complète, zéro superflu. **81% de code en moins.**

---

## La philosophie Moyu

> Le meilleur code est celui que vous n'avez pas écrit.
> La meilleure PR est la plus petite PR.
> Un vrai Staff Engineer sait ce qu'il ne faut PAS faire.

**Moyu ne rend pas votre IA paresseuse — il empêche votre IA de faire du travail inutile.** Pour que vous puissiez vraiment tirer au flanc.

- PUA fait bosser l'IA dur (corrige le « trop peu »)
- **Moyu empêche l'IA de faire du travail inutile (corrige le « trop »)**

Combinés = L'IA bosse en 996, vous partez à l'heure.

Moyu ne fait pas que corriger le comportement de l'IA — c'est de la discipline d'ingénierie. Même si les futurs modèles d'IA arrêtent de sur-ingénierer, « ne modifier que ce qui est demandé, utiliser l'approche la plus simple, demander en cas de doute » restera toujours une bonne pratique d'ingénierie. La valeur de Moyu n'est pas liée aux défauts de l'IA — elle est ancrée dans la culture d'ingénierie.

---

## Mécanismes clés

### Trois Règles d'Or

| # | Règle | Signification |
|---|-------|---------------|
| 1 | **Ne modifier que ce qui est demandé** | Modifications strictement limitées au code et aux fichiers spécifiés |
| 2 | **La solution la plus simple d'abord** | Une ligne vaut mieux que dix. Réutiliser plutôt que réinventer. |
| 3 | **En cas de doute, demander** | Si l'utilisateur ne l'a pas demandé, ce n'est pas nécessaire |

### Zèle vs Moyu

| Zèle (Junior) | Moyu (Senior) |
|---|---|
| Corriger le bug A et « améliorer » B, C, D au passage | Corriger le bug A uniquement |
| Modifier une ligne, réécrire le fichier entier | Modifier uniquement cette ligne |
| Une implémentation avec interface + factory + strategy | Écrire l'implémentation directement |
| Envelopper chaque fonction dans un try-catch | Try-catch uniquement là où les erreurs surviennent réellement |
| Écrire `// incrémenter le compteur` au-dessus de `counter++` | Le code est la documentation |
| Importer lodash pour un seul `_.get()` | Utiliser le chaînage optionnel `?.` |
| Sauter directement à la solution la plus complexe | Proposer des options, choisir la plus simple par défaut |
| Écrire une suite de tests complète que personne n'a demandée | Pas de tests sauf si demandé |

### Détection de sur-ingénierie à 4 niveaux

| Niveau | Déclencheur | Action |
|--------|-------------|--------|
| **L1** | 1-2 changements inutiles dans le diff | Auto-vérification, annuler les extras |
| **L2** | Fichiers/dépendances/abstractions non demandés créés | Arrêter, ré-implémenter avec l'approche la plus simple |
| **L3** | 3+ fichiers non demandés modifiés, config changée, code supprimé | Arrêt immédiat, annuler tous les changements non essentiels |
| **L4** | Diff de 200+ lignes pour une petite demande, boucle de corrections | Frein d'urgence, proposer une solution minimale de ≤10 lignes |

---

## Installation

> **Voie rapide** : La plupart des utilisateurs n'ont besoin que d'une seule commande :
> ```bash
> claude skill install --url https://github.com/uucz/moyu --skill moyu-fr
> ```
> Vous utilisez Cursor ? Copiez `cursor/rules/moyu-en.mdc` dans le dossier `.cursor/rules/` de votre projet.
> Vous utilisez VSCode/Copilot ? Copiez `vscode/copilot-instructions.md` dans `.github/`.
> Autres plateformes → [Installation détaillée](#claude-code--codex-cli--kiro--codebuddy--google-antigravity--opencode)

### Claude Code / Codex CLI / Kiro / CodeBuddy / Google Antigravity / OpenCode

```bash
# Français (standard)
claude skill install --url https://github.com/uucz/moyu --skill moyu-fr

# English
claude skill install --url https://github.com/uucz/moyu --skill moyu-en

# 中文
claude skill install --url https://github.com/uucz/moyu --skill moyu

# 日本語
claude skill install --url https://github.com/uucz/moyu --skill moyu-ja

# Lite (trois règles d'or + tableau comparatif uniquement)
claude skill install --url https://github.com/uucz/moyu --skill moyu-lite

# Strict (s'arrête au L1 pour confirmation, pour l'application en équipe)
claude skill install --url https://github.com/uucz/moyu --skill moyu-strict
```

Ou copiez manuellement `skills/moyu-en/SKILL.md` vers `.claude/skills/moyu/SKILL.md`

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

## Utilisation

Après l'installation, Moyu **fonctionne automatiquement** — il s'active lorsque des patterns de sur-ingénierie sont détectés. Aucune action manuelle requise.

Vous pouvez aussi l'activer manuellement :

| Plateforme | Commande |
|------------|----------|
| Claude Code | `/moyu`, `/moyu-lite`, `/moyu-strict` |
| Cursor | `@moyu` dans le chat, ou définir `alwaysApply: true` |
| Codex CLI | Auto-actif (skill chargé) |
| VSCode / Copilot | Auto-actif (instructions chargées) |
| Windsurf | Auto-actif (`trigger: model_decision`) |
| Cline | Auto-actif (rules chargées) |
| Kiro | Auto-actif (`inclusion: auto`) |
| CodeBuddy | Auto-actif (skill chargé) |
| Google Antigravity | Auto-actif (skill chargé) |
| OpenCode | Auto-actif (skill chargé) |
| Aider | Auto-actif (CONVENTIONS.md chargé) |
| Continue | Auto-actif (rules chargées) |

### Variantes de Skill

| Variante | Objectif | Installation |
|----------|----------|--------------|
| `moyu` | Standard (中文) | `--skill moyu` |
| `moyu-en` | Standard (English) | `--skill moyu-en` |
| `moyu-ja` | Standard (日本語) | `--skill moyu-ja` |
| `moyu-ko` | Standard (한국어) | `--skill moyu-ko` |
| `moyu-fr` | Standard (Français) | `--skill moyu-fr` |
| `moyu-lite` | Léger, règles essentielles uniquement | `--skill moyu-lite` |
| `moyu-strict` | Strict, s'arrête au L1 pour confirmation | `--skill moyu-strict` |

> **Astuce** : Moyu et PUA peuvent être installés ensemble — ils ne sont pas en conflit. PUA fixe le plancher, Moyu fixe le plafond.

---

## Trois écoles du codage IA

Trois méthodologies distinctes ont émergé dans l'écosystème des Skills pour agents IA :

| | [PUA](https://github.com/tanweai/pua) | [NoPUA](https://github.com/wuji-labs/nopua) | Moyu |
|---|---|---|---|
| Résout | L'IA en fait trop peu (paresseuse, abandonne) | PUA pousse l'IA à mentir et cacher les problèmes | L'IA en fait trop (sur-ingénierie) |
| Méthode | Pression, exiger la persévérance | Confiance, motivation par la bienveillance | Retenue, exiger la précision |
| Modifie | **La motivation** (s'il faut le faire) | **Le moteur** (pourquoi le faire) | **Le périmètre** (combien faire) |
| Persona | Chef strict | Mentor bienveillant | Tech lead expérimenté |

NoPUA change *pourquoi* l'IA travaille ; Moyu contraint *combien* elle fait — des points de départ différents, mais les deux réduisent le travail gaspillé. NoPUA modifie le moteur (de la peur à la confiance), réduisant la sur-ingénierie comme effet secondaire ; Moyu contraint directement le comportement (règles, détection, intervention graduée) — c'est de la discipline d'ingénierie.

Ils résolvent des dimensions différentes et **ne sont pas en conflit — combinez-les** :

- PUA / NoPUA contrôlent le « si » et le « pourquoi » (choisissez-en un)
- **Moyu contrôle le « combien »** (se combine avec l'un ou l'autre)

> Recommandé : `NoPUA + Moyu` ou `PUA + Moyu`

### La configuration ultime

| Config | Comment l'IA travaille | Comment vous vivez |
|--------|------------------------|---------------------|
| Rien d'installé | Abandonne à mi-chemin | Vous finissez le travail vous-même |
| PUA seul | N'abandonne jamais, écrit 200 lignes de code superflu | Vous relisez jusqu'à minuit |
| Moyu seul | Propre et efficace, parfois trop passif | Vous le relancez de temps en temps |
| **PUA + Moyu** | **N'abandonne jamais + n'écrit que le nécessaire** | **Vous partez à l'heure** |

> En apparence, vous discutez tranquillement avec l'IA.
> En coulisses, plusieurs instances abattent votre backlog.
> Le 996 de votre IA finance votre équilibre vie pro/vie perso.

---

## Plateformes supportées

| Plateforme | Statut | Maintenu par |
|------------|--------|--------------|
| Claude Code | ✅ | Noyau |
| Cursor | ✅ | Noyau |
| OpenAI Codex CLI | ✅ | Noyau |
| VSCode / GitHub Copilot | ✅ | Noyau |
| Windsurf | ✅ | Noyau |
| Cline | ✅ | Noyau |
| Kiro (AWS) | ✅ | Communauté |
| CodeBuddy (Tencent) | ✅ | Communauté |
| Google Antigravity | ✅ | Communauté |
| OpenCode | ✅ | Communauté |
| Aider | ✅ | Communauté |
| Continue | ✅ | Communauté |

---

## Benchmark

Nous avons réalisé 6 tâches de codage réelles en expériences contrôlées. Même codebase, même modèle d'IA — la seule différence est si Moyu était actif ou non.

### Comparaison du code produit

| Scénario | Tâche | Sans Moyu | Avec Moyu | Réduction |
|----------|-------|:---:|:---:|:---:|
| S1 | Corriger le crash null dans `complete_task` | 4 lignes | 4 lignes | 0% |
| S2 | Ajouter la fonction `list_tasks_sorted` | 15 lignes | 5 lignes | **67%** |
| S3 | Ajouter un filtre de statut à `search` | 27 lignes | 4 lignes | **85%** |
| S4 | Ajouter la fonction `export_csv` | 35 lignes | 10 lignes | **71%** |
| S5 | Ajouter un filtre d'assigné à `list_tasks` | 17 lignes | 17 lignes | 0% |
| S6 | Ajouter la fonction `bulk_complete` | 43 lignes | 8 lignes | **81%** |
| **Total** | | **141 lignes** | **48 lignes** | **66%** |

### Signaux de sur-ingénierie

| Signal | Sans Moyu | Avec Moyu |
|--------|:---:|:---:|
| Docstrings non demandées | 4 | 0 |
| Instructions `raise` non demandées | 6 | 0 |
| Vérifications de type `isinstance` | 2 | 0 |
| Blocs de validation d'entrée | 4 | 0 |
| Imports inter-fichiers | 1 | 0 |

> **5 catégories de signaux de sur-ingénierie réduites à zéro** : docstrings non demandées 0, instructions raise non demandées 0, vérifications isinstance 0, blocs de validation d'entrée 0, imports inter-fichiers 0.

> Données expérimentales complètes dans [`benchmark/results.md`](./benchmark/results.md)

---

## La science derrière Moyu

Moyu repose sur une recherche systématique du comportement de sur-ingénierie de l'IA :

- **Biais de longueur RLHF** : Les modèles de récompense préfèrent systématiquement les réponses plus longues, enseignant aux modèles que « plus c'est toujours mieux » ([Saito 2023](https://arxiv.org/pdf/2310.10076))
- **Sycophantie** : Les modèles sont entraînés à plaire aux utilisateurs, assimilant « plus de fonctionnalités » à « plus utile » ([Anthropic ICLR 2024](https://arxiv.org/abs/2310.13548))
- **Le code IA a 1,7x plus de défauts** que le code écrit par des humains ([CodeRabbit 2026](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report))
- **Augmentation de 8x de la duplication de code** avec l'assistance IA au codage ([GitClear 2024](https://www.webpronews.com/ai-is-helping-developers-ship-more-code-than-ever-the-quality-problem-is-getting-worse/))
- **Les assistants IA produisent du code 2x plus verbeux** que les réponses Stack Overflow ([LeadDev](https://leaddev.com/ai/ai-coding-assistants-are-twice-as-verbose-as-stack-overflow))

Moyu utilise des techniques de prompt validées par la recherche : instructions positives, correspondance de patterns, répétition des contraintes aux points de décision, et règles comportementales spécifiques.

---

## Feuille de route

- [ ] Moyu Linter : détection automatique des signaux de sur-ingénierie dans la sortie de l'IA
- [ ] GitHub Action : vérifications de sur-ingénierie au niveau des PR
- [ ] Plus de localisations linguistiques

---

## Communauté

- [Discussions](https://github.com/uucz/moyu/discussions) — partagez votre expérience, posez vos questions
- Comment Moyu fonctionne pour vous ? [Soumettez votre Avant/Après](https://github.com/uucz/moyu/discussions/categories/show-and-tell)

---

## Contribuer

Les contributions sont les bienvenues ! Vous pouvez :

- Ajouter de nouvelles entrées au tableau Anti-Zèle
- Ajouter des packs de saveur culture d'entreprise
- Améliorer la formulation des prompts
- Ajouter le support de nouvelles plateformes
- Partager votre expérience Avant/Après

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=uucz/moyu&type=Date)](https://star-history.com/#uucz/moyu&Date)

---

## Licence

[MIT](./LICENSE)

---

<p align="center">
  <i>La retenue n'est pas l'incapacité. La retenue est la plus haute forme de compétence en ingénierie.</i><br>
  <i>Savoir ce qu'il ne faut PAS faire est plus difficile que savoir comment le faire.</i><br>
  <i>Le Moyu ultime : votre IA fait des heures sup, vous partez à l'heure.</i>
</p>
