#!/usr/bin/env python3
"""Moyu Demo — Before/After in Claude Code terminal style."""
import time, sys

# ── Colors ─────────────────────────────────────────────
R   = "\033[31m"
G   = "\033[32m"
Y   = "\033[33m"
M   = "\033[35m"
C   = "\033[36m"
WH  = "\033[97m"
DIM = "\033[2m"
BLD = "\033[1m"
RST = "\033[0m"
GRY = "\033[90m"
ORG = "\033[38;5;173m"
PNK = "\033[38;5;210m"  # pink like Claude Code title

BW = 54

def p(s="", d=0.04):
    print(s); time.sleep(d)

def slow(text, color="", d=0.03):
    for ch in text:
        sys.stdout.write(color + ch + RST)
        sys.stdout.flush()
        time.sleep(d)
    print()

def title(text):
    """Claude Code style title: ── text ─────────"""
    pad = BW - len(text) - 4
    print(f"  {PNK}── {text} {'─' * max(pad, 4)}{RST}")

def spinner(msg, secs=1.2):
    frames = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    end = time.time() + secs
    i = 0
    while time.time() < end:
        sys.stdout.write(f"\r  {C}{frames[i % len(frames)]}{RST} {DIM}{msg}{RST}  ")
        sys.stdout.flush()
        time.sleep(0.08)
        i += 1
    sys.stdout.write("\r" + " " * 60 + "\r")
    sys.stdout.flush()

# ═══════════════════════════════════════════════════════
#  SCENE 1 — WITHOUT Moyu
# ═══════════════════════════════════════════════════════
time.sleep(0.5)
p()
title("Claude Code v2.1")
p()

# User prompt
sys.stdout.write(f"  {BLD}{WH}> {RST}")
slow("Fix the login button color to blue", WH, 0.035)
p()
time.sleep(0.3)

spinner("Thinking…", 1.4)

# Claude response
p(f"  I'll fix that! Let me also update the theme system", 0.02)
p(f"  and add test coverage.", 0.02)
p()
time.sleep(0.4)

files_bad = [
    ("Edit ", "src/components/Button.tsx",      "+52 lines", ""),
    ("Write", "src/components/Button.test.tsx", "+94 lines", f"{R}← not asked{RST}"),
    ("Write", "src/styles/theme.ts",            "+31 lines", f"{R}← not asked{RST}"),
    ("Write", "src/utils/colorHelpers.ts",      "+28 lines", f"{R}← not asked{RST}"),
    ("Edit ", "src/types/index.d.ts",           "+12 lines", f"{R}← not asked{RST}"),
    ("Edit ", "README.md",                       "+8 lines", f"{R}← not asked{RST}"),
]
for tool, fname, lines, note in files_bad:
    note_str = f"  {DIM}{note}" if note else ""
    p(f"    {GRY}{tool}{RST} {WH}{fname:<36}{RST} {Y}{lines}{RST}{note_str}", 0.13)

p()
p(f"  {R}{BLD}✗  6 files · 225 lines added{RST}")
p()
time.sleep(2.5)

# ═══════════════════════════════════════════════════════
#  SCENE 2 — WITH Moyu
# ═══════════════════════════════════════════════════════
p(f"  {GRY}{'─' * BW}{RST}", 0.5)
p()
title("Claude Code v2.1")
p(f"  {ORG}{BLD}><(((º>{RST} {ORG}moyu{RST} {GRY}active{RST}")
p()
time.sleep(0.5)

# Same prompt
sys.stdout.write(f"  {BLD}{WH}> {RST}")
slow("Fix the login button color to blue", WH, 0.035)
p()
time.sleep(0.3)

spinner("Thinking…", 1.0)

# Moyu response — minimal
p(f"  Fixed.", 0.03)
p()
time.sleep(0.3)

p(f"    {GRY}Edit{RST}  {WH}src/components/Button.tsx{RST}       {Y}+1 line{RST}", 0.2)
p()
p(f"      {R}- color: 'red',{RST}", 0.1)
p(f"      {G}+ color: 'blue',{RST}", 0.1)
p()
p(f"  {G}{BLD}✓  1 file · 1 line changed{RST}")
p()
time.sleep(1.5)

# Tagline
p(f"  {GRY}{'─' * BW}{RST}", 0.1)
p(f"  {DIM}The best code is code you didn't write.{RST}")
p(f"  {GRY}github.com/uucz/moyu{RST}")
p()
time.sleep(2.0)
