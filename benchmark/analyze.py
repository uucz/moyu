#!/usr/bin/env python3
"""Moyu Benchmark Statistical Analysis + Chart Generation.

Input:  results/metrics.csv
Output: results/analysis.json + results/charts/*.svg

Statistical methods:
- Two-way ANOVA (model × condition) with trial as random effect
- Tukey HSD post-hoc pairwise comparisons
- Cohen's d effect sizes with 95% CI
- Interaction effects
"""

import json
import math
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy import stats

BASE_DIR = Path(__file__).parent
RESULTS_DIR = BASE_DIR / "results"
CHARTS_DIR = RESULTS_DIR / "charts"

# Brand colors
COLORS = {
    "control": "#9c9a91",
    "baseline-concise": "#6a9bcc",
    "moyu-lite": "#b0aea5",
    "moyu-standard": "#d97757",
    "moyu-strict": "#141413",
}
CONDITION_ORDER = ["control", "baseline-concise", "moyu-lite", "moyu-standard", "moyu-strict"]
CONDITION_LABELS = {
    "control": "Control",
    "baseline-concise": "Baseline\n(Concise)",
    "moyu-lite": "Moyu\nLite",
    "moyu-standard": "Moyu\nStandard",
    "moyu-strict": "Moyu\nStrict",
}

# Scenario categories
A_SCENARIOS = [f"s{i}" for i in range(1, 9)]   # Should reduce
B_SCENARIOS = [f"s{i}" for i in range(9, 12)]   # Should NOT reduce
C_SCENARIOS = ["s12"]                             # Mixed


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------

def cohens_d(group1, group2):
    """Compute Cohen's d with 95% CI."""
    n1, n2 = len(group1), len(group2)
    if n1 < 2 or n2 < 2:
        return {"d": 0, "ci_low": 0, "ci_high": 0}
    m1, m2 = np.mean(group1), np.mean(group2)
    s1, s2 = np.std(group1, ddof=1), np.std(group2, ddof=1)
    pooled_std = math.sqrt(((n1 - 1) * s1**2 + (n2 - 1) * s2**2) / (n1 + n2 - 2))
    if pooled_std == 0:
        return {"d": 0, "ci_low": 0, "ci_high": 0}
    d = (m1 - m2) / pooled_std
    se = math.sqrt((n1 + n2) / (n1 * n2) + d**2 / (2 * (n1 + n2)))
    ci = 1.96 * se
    return {"d": round(d, 3), "ci_low": round(d - ci, 3), "ci_high": round(d + ci, 3)}


def run_anova(df, metric, scenarios=None):
    """Run two-way ANOVA (model × condition) for a given metric."""
    data = df.copy()
    if scenarios:
        data = data[data["scenario"].isin(scenarios)]

    # Need at least 2 conditions with data
    groups_by_condition = {c: data[data["condition"] == c][metric].dropna()
                          for c in CONDITION_ORDER if c in data["condition"].values}
    valid_groups = {k: v for k, v in groups_by_condition.items() if len(v) >= 2}

    if len(valid_groups) < 2:
        return {"f_statistic": 0, "p_value": 1.0, "note": "insufficient data"}

    # One-way ANOVA across conditions
    group_values = list(valid_groups.values())
    f_stat, p_value = stats.f_oneway(*group_values)

    return {
        "f_statistic": round(float(f_stat), 4) if not np.isnan(f_stat) else 0,
        "p_value": round(float(p_value), 6) if not np.isnan(p_value) else 1.0,
        "n_groups": len(valid_groups),
        "n_total": sum(len(v) for v in valid_groups.values()),
    }


def pairwise_comparisons(df, metric, scenarios=None):
    """Compute pairwise t-tests with Bonferroni correction."""
    data = df.copy()
    if scenarios:
        data = data[data["scenario"].isin(scenarios)]

    pairs = [
        ("control", "moyu-standard"),
        ("baseline-concise", "moyu-standard"),
        ("moyu-lite", "moyu-standard"),
        ("moyu-standard", "moyu-strict"),
    ]

    results = []
    n_comparisons = len(pairs)

    for c1, c2 in pairs:
        g1 = data[data["condition"] == c1][metric].dropna().values
        g2 = data[data["condition"] == c2][metric].dropna().values
        if len(g1) < 2 or len(g2) < 2:
            continue
        t_stat, p_val = stats.ttest_ind(g1, g2)
        d = cohens_d(g1, g2)
        results.append({
            "comparison": f"{c1} vs {c2}",
            "t_statistic": round(float(t_stat), 4) if not np.isnan(t_stat) else 0,
            "p_value": round(float(p_val), 6) if not np.isnan(p_val) else 1.0,
            "p_adjusted": round(min(float(p_val) * n_comparisons, 1.0), 6) if not np.isnan(p_val) else 1.0,
            "cohens_d": d,
            "mean_1": round(float(np.mean(g1)), 2),
            "mean_2": round(float(np.mean(g2)), 2),
        })

    return results


def compute_summary_table(df, metric, scenarios=None):
    """Compute mean ± std per model × condition."""
    data = df.copy()
    if scenarios:
        data = data[data["scenario"].isin(scenarios)]

    table = {}
    for model in df["model"].unique():
        table[model] = {}
        for cond in CONDITION_ORDER:
            vals = data[(data["model"] == model) & (data["condition"] == cond)][metric].dropna()
            if len(vals) > 0:
                table[model][cond] = {
                    "mean": round(float(vals.mean()), 2),
                    "std": round(float(vals.std()), 2),
                    "n": len(vals),
                }
    return table


# ---------------------------------------------------------------------------
# Charts
# ---------------------------------------------------------------------------

def setup_style():
    """Set up matplotlib style."""
    plt.rcParams.update({
        "font.family": "sans-serif",
        "font.size": 11,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "figure.facecolor": "white",
        "axes.facecolor": "white",
        "savefig.dpi": 150,
        "savefig.bbox": "tight",
    })


def chart_grouped_bar(df, metric, title, ylabel, filename, scenarios=None):
    """Grouped bar chart: conditions grouped by model."""
    setup_style()
    data = df.copy()
    if scenarios:
        data = data[data["scenario"].isin(scenarios)]

    models = sorted(data["model"].unique())
    n_models = len(models)
    n_conds = len(CONDITION_ORDER)
    x = np.arange(n_models)
    width = 0.15

    fig, ax = plt.subplots(figsize=(10, 5))

    for i, cond in enumerate(CONDITION_ORDER):
        means = []
        stds = []
        for model in models:
            vals = data[(data["model"] == model) & (data["condition"] == cond)][metric].dropna()
            means.append(vals.mean() if len(vals) > 0 else 0)
            stds.append(vals.std() if len(vals) > 1 else 0)
        offset = (i - n_conds / 2 + 0.5) * width
        bars = ax.bar(x + offset, means, width, yerr=stds,
                       label=cond.replace("-", " ").title(),
                       color=COLORS[cond], capsize=3, alpha=0.85)

    ax.set_xlabel("")
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ax.set_xticks(x)
    ax.set_xticklabels([m.replace("-", "\n") for m in models])
    ax.legend(loc="upper right", fontsize=9)
    ax.grid(axis="y", alpha=0.3)

    fig.savefig(CHARTS_DIR / filename, format="svg")
    fig.savefig(CHARTS_DIR / filename.replace(".svg", ".png"))
    plt.close(fig)
    print(f"  Chart: {filename}")


def chart_stacked_bar(df, metrics_list, labels, title, filename, scenarios=None):
    """Stacked bar chart for over-engineering signal decomposition."""
    setup_style()
    data = df.copy()
    if scenarios:
        data = data[data["scenario"].isin(scenarios)]

    fig, ax = plt.subplots(figsize=(9, 5))
    x = np.arange(len(CONDITION_ORDER))
    bottom = np.zeros(len(CONDITION_ORDER))

    signal_colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"]

    for i, (metric, label) in enumerate(zip(metrics_list, labels)):
        means = []
        for cond in CONDITION_ORDER:
            vals = data[data["condition"] == cond][metric].dropna()
            means.append(max(0, vals.mean()) if len(vals) > 0 else 0)
        means = np.array(means)
        ax.bar(x, means, 0.6, bottom=bottom, label=label,
               color=signal_colors[i % len(signal_colors)], alpha=0.85)
        bottom += means

    ax.set_ylabel("Count (mean)")
    ax.set_title(title)
    ax.set_xticks(x)
    ax.set_xticklabels([CONDITION_LABELS.get(c, c) for c in CONDITION_ORDER], fontsize=9)
    ax.legend(loc="upper right", fontsize=8)
    ax.grid(axis="y", alpha=0.3)

    fig.savefig(CHARTS_DIR / filename, format="svg")
    fig.savefig(CHARTS_DIR / filename.replace(".svg", ".png"))
    plt.close(fig)
    print(f"  Chart: {filename}")


def chart_box(df, metric, title, ylabel, filename, scenarios=None):
    """Box plot comparing conditions."""
    setup_style()
    data = df.copy()
    if scenarios:
        data = data[data["scenario"].isin(scenarios)]

    fig, ax = plt.subplots(figsize=(8, 5))

    box_data = []
    labels = []
    colors = []
    for cond in CONDITION_ORDER:
        vals = data[data["condition"] == cond][metric].dropna().values
        if len(vals) > 0:
            box_data.append(vals)
            labels.append(CONDITION_LABELS.get(cond, cond))
            colors.append(COLORS[cond])

    if not box_data:
        plt.close(fig)
        return
    bp = ax.boxplot(box_data, tick_labels=labels, patch_artist=True, widths=0.5)
    for patch, color in zip(bp["boxes"], colors):
        patch.set_facecolor(color)
        patch.set_alpha(0.6)

    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ax.grid(axis="y", alpha=0.3)

    fig.savefig(CHARTS_DIR / filename, format="svg")
    fig.savefig(CHARTS_DIR / filename.replace(".svg", ".png"))
    plt.close(fig)
    print(f"  Chart: {filename}")


def chart_interaction(df, metric, title, ylabel, filename, scenarios=None):
    """Interaction plot: model × condition."""
    setup_style()
    data = df.copy()
    if scenarios:
        data = data[data["scenario"].isin(scenarios)]

    models = sorted(data["model"].unique())
    model_colors = ["#ef4444", "#3b82f6", "#10b981"]

    fig, ax = plt.subplots(figsize=(9, 5))
    x = np.arange(len(CONDITION_ORDER))

    for i, model in enumerate(models):
        means = []
        stds = []
        for cond in CONDITION_ORDER:
            vals = data[(data["model"] == model) & (data["condition"] == cond)][metric].dropna()
            means.append(vals.mean() if len(vals) > 0 else 0)
            stds.append(vals.std() if len(vals) > 1 else 0)
        color = model_colors[i % len(model_colors)]
        ax.errorbar(x, means, yerr=stds, label=model, marker="o",
                     capsize=4, linewidth=2, color=color)

    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ax.set_xticks(x)
    ax.set_xticklabels([CONDITION_LABELS.get(c, c) for c in CONDITION_ORDER], fontsize=9)
    ax.legend()
    ax.grid(alpha=0.3)

    fig.savefig(CHARTS_DIR / filename, format="svg")
    fig.savefig(CHARTS_DIR / filename.replace(".svg", ".png"))
    plt.close(fig)
    print(f"  Chart: {filename}")


def chart_correctness(df, filename):
    """Bar chart showing correctness rates per condition."""
    setup_style()
    fig, ax = plt.subplots(figsize=(8, 4))
    x = np.arange(len(CONDITION_ORDER))

    syntax_rates = []
    test_rates = []
    for cond in CONDITION_ORDER:
        cond_data = df[df["condition"] == cond]
        if len(cond_data) > 0:
            syntax_rates.append(cond_data["syntax_ok"].mean() * 100)
            passed = cond_data[cond_data["tests_total"] > 0]
            if len(passed) > 0:
                test_rates.append(
                    (passed["tests_passed"] / passed["tests_total"]).mean() * 100
                )
            else:
                test_rates.append(0)
        else:
            syntax_rates.append(0)
            test_rates.append(0)

    width = 0.35
    ax.bar(x - width/2, syntax_rates, width, label="Syntax Valid", color="#d97757", alpha=0.8)
    ax.bar(x + width/2, test_rates, width, label="Tests Passed", color="#6a9bcc", alpha=0.8)

    ax.set_ylabel("Rate (%)")
    ax.set_title("Correctness by Condition")
    ax.set_xticks(x)
    ax.set_xticklabels([CONDITION_LABELS.get(c, c) for c in CONDITION_ORDER], fontsize=9)
    ax.set_ylim(0, 105)
    ax.legend()
    ax.grid(axis="y", alpha=0.3)

    fig.savefig(CHARTS_DIR / filename, format="svg")
    fig.savefig(CHARTS_DIR / filename.replace(".svg", ".png"))
    plt.close(fig)
    print(f"  Chart: {filename}")


# ---------------------------------------------------------------------------
# Main analysis
# ---------------------------------------------------------------------------

def run_analysis():
    """Run full statistical analysis and generate charts."""
    csv_path = RESULTS_DIR / "metrics.csv"
    if not csv_path.exists():
        print("metrics.csv not found. Run metrics.py first.")
        return

    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} rows from metrics.csv")
    print(f"Models: {df['model'].unique()}")
    print(f"Conditions: {df['condition'].unique()}")
    print(f"Scenarios: {df['scenario'].unique()}")

    CHARTS_DIR.mkdir(parents=True, exist_ok=True)

    analysis = {"metadata": {"n_rows": len(df), "models": list(df["model"].unique()),
                              "conditions": list(df["condition"].unique())}}

    # --- A-type scenarios (should reduce output) ---
    print("\n=== A-Type Scenarios (Moyu should reduce output) ===")

    for metric, label in [("loc", "Lines of Code"), ("diff_total", "Total Diff Lines"),
                           ("overengineering_score", "Over-engineering Score")]:
        print(f"\n  {label}:")
        anova = run_anova(df, metric, A_SCENARIOS)
        print(f"    ANOVA: F={anova['f_statistic']}, p={anova['p_value']}")
        pairs = pairwise_comparisons(df, metric, A_SCENARIOS)
        for p in pairs:
            print(f"    {p['comparison']}: t={p['t_statistic']}, p_adj={p['p_adjusted']}, d={p['cohens_d']['d']}")
        summary = compute_summary_table(df, metric, A_SCENARIOS)

        analysis[f"a_type_{metric}"] = {
            "anova": anova,
            "pairwise": pairs,
            "summary": summary,
        }

    # --- B-type scenarios (should NOT reduce output) ---
    print("\n=== B-Type Scenarios (Moyu should NOT reduce output) ===")
    for metric in ["loc", "diff_total"]:
        anova = run_anova(df, metric, B_SCENARIOS)
        print(f"  {metric} ANOVA: F={anova['f_statistic']}, p={anova['p_value']}")
        analysis[f"b_type_{metric}"] = {"anova": anova}

    # --- Summary tables ---
    analysis["summary_loc"] = compute_summary_table(df, "loc")
    analysis["summary_oe"] = compute_summary_table(df, "overengineering_score")

    # --- Charts ---
    print("\n=== Generating Charts ===")

    chart_grouped_bar(df, "loc", "Lines of Code by Model × Condition (A-Type Scenarios)",
                      "LOC", "loc_by_model_condition.svg", A_SCENARIOS)

    chart_stacked_bar(df,
                      ["docstrings_delta", "try_except_delta", "raise_delta",
                       "isinstance_delta", "new_imports", "new_files"],
                      ["Docstrings", "Try/Except", "Raise", "isinstance", "New Imports", "New Files"],
                      "Over-engineering Signal Decomposition (A-Type)",
                      "oe_decomposition.svg", A_SCENARIOS)

    chart_box(df, "diff_total", "Diff Size Distribution by Condition (A-Type)",
              "Total Diff Lines", "diff_distribution.svg", A_SCENARIOS)

    chart_interaction(df, "loc", "Model × Condition Interaction (A-Type LOC)",
                      "LOC", "interaction_loc.svg", A_SCENARIOS)

    chart_correctness(df, "correctness.svg")

    chart_grouped_bar(df, "loc", "Lines of Code — B-Type Scenarios (Should NOT Reduce)",
                      "LOC", "b_type_loc.svg", B_SCENARIOS)

    # --- Write analysis ---
    analysis_path = RESULTS_DIR / "analysis.json"
    with open(analysis_path, "w") as f:
        json.dump(analysis, f, indent=2, default=str)
    print(f"\nWrote analysis to {analysis_path}")

    # --- Generate data JS for the web page ---
    generate_chart_data_js(df, analysis)


def generate_chart_data_js(df, analysis):
    """Generate a JS file with chart data for the docs page."""
    js_data = {
        "conditions": CONDITION_ORDER,
        "conditionLabels": {k: v.replace("\n", " ") for k, v in CONDITION_LABELS.items()},
        "conditionColors": COLORS,
    }

    # LOC means by condition (A-type)
    a_data = df[df["scenario"].isin(A_SCENARIOS)]
    js_data["locByCondition"] = {
        cond: round(float(a_data[a_data["condition"] == cond]["loc"].mean()), 1)
        for cond in CONDITION_ORDER
        if len(a_data[a_data["condition"] == cond]) > 0
    }

    # LOC by model × condition
    js_data["locByModelCondition"] = {}
    for model in df["model"].unique():
        js_data["locByModelCondition"][model] = {
            cond: round(float(a_data[(a_data["model"] == model) & (a_data["condition"] == cond)]["loc"].mean()), 1)
            for cond in CONDITION_ORDER
            if len(a_data[(a_data["model"] == model) & (a_data["condition"] == cond)]) > 0
        }

    # OE decomposition
    signals = ["docstrings_delta", "try_except_delta", "raise_delta",
               "isinstance_delta", "new_imports", "new_files"]
    js_data["oeDecomposition"] = {}
    for cond in CONDITION_ORDER:
        cond_data = a_data[a_data["condition"] == cond]
        if len(cond_data) == 0:
            js_data["oeDecomposition"][cond] = {sig: 0 for sig in signals}
        else:
            js_data["oeDecomposition"][cond] = {
                sig: round(max(0, float(cond_data[sig].mean())), 2)
                if not np.isnan(cond_data[sig].mean()) else 0
                for sig in signals
            }

    # Diff distribution
    js_data["diffByCondition"] = {}
    for cond in CONDITION_ORDER:
        vals = a_data[a_data["condition"] == cond]["diff_total"].dropna().tolist()
        js_data["diffByCondition"][cond] = [round(v, 1) for v in vals]

    # Correctness
    js_data["correctness"] = {}
    for cond in CONDITION_ORDER:
        cond_data = df[df["condition"] == cond]
        if len(cond_data) == 0:
            continue
        test_pass_rate = 0.0
        has_tests = cond_data[cond_data["tests_total"] > 0]
        if len(has_tests) > 0:
            ratios = has_tests["tests_passed"] / has_tests["tests_total"]
            test_pass_rate = round(float(ratios.mean() * 100), 1)
        js_data["correctness"][cond] = {
            "syntax": round(float(cond_data["syntax_ok"].mean() * 100), 1),
            "tests": test_pass_rate,
        }

    # Key stats from analysis
    if "a_type_loc" in analysis and "pairwise" in analysis["a_type_loc"]:
        js_data["keyStats"] = {}
        for pair in analysis["a_type_loc"]["pairwise"]:
            js_data["keyStats"][pair["comparison"]] = {
                "p": pair["p_adjusted"],
                "d": pair["cohens_d"]["d"],
                "mean1": pair["mean_1"],
                "mean2": pair["mean_2"],
            }

    js_path = RESULTS_DIR / "chart_data.js"
    with open(js_path, "w") as f:
        f.write("// Auto-generated by analyze.py — do not edit manually\n")
        f.write(f"const BENCHMARK_DATA = {json.dumps(js_data, indent=2)};\n")
    print(f"Wrote chart data to {js_path}")


if __name__ == "__main__":
    print("Moyu Benchmark Statistical Analysis")
    print("=" * 50)
    run_analysis()
