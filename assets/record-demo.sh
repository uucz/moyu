#!/bin/bash
# Demo recording script for Moyu
# Records a before/after comparison showing AI over-engineering vs Moyu-constrained output
#
# Prerequisites:
#   brew install asciinema agg
#
# Usage:
#   1. Run: ./assets/record-demo.sh
#   2. In the terminal, paste the demo script below
#   3. Press Ctrl+D to stop recording
#   4. Convert: agg assets/demo.cast assets/demo.gif --cols 80 --rows 24
#
# Alternative (if you prefer manual recording):
#   asciinema rec assets/demo.cast --cols 80 --rows 24 --idle-time-limit 2

echo "=== Moyu Demo Recording ==="
echo ""
echo "This will start an asciinema recording."
echo "Follow the script below in the terminal, then Ctrl+D to stop."
echo ""
echo "--- DEMO SCRIPT ---"
echo ""
echo '1. Show the prompt:'
echo '   echo "Task: Fix the login button color to blue"'
echo ''
echo '2. Show WITHOUT Moyu (over-engineered response):'
echo '   cat <<EOF'
echo '   # Without Moyu - AI changes 8 files, 200+ lines:'
echo '   Modified: src/components/Button.tsx        (+45 lines)'
echo '   Modified: src/components/Button.test.tsx   (+80 lines)  # not asked'
echo '   Modified: src/styles/theme.ts              (+30 lines)  # not asked'
echo '   Modified: src/utils/colors.ts              (+25 lines)  # not asked'
echo '   Modified: src/types/button.d.ts            (+15 lines)  # not asked'
echo '   Modified: README.md                        (+10 lines)  # not asked'
echo '   Total: 205 lines changed across 6 files'
echo '   EOF'
echo ''
echo '3. Show WITH Moyu (minimal, correct response):'
echo '   cat <<EOF'
echo '   # With Moyu - AI changes exactly what was asked:'
echo '   Modified: src/components/Button.tsx        (+1 line)'
echo '   - color: "red" -> color: "blue"'
echo '   Total: 1 line changed in 1 file'
echo '   EOF'
echo ''
echo "--- END SCRIPT ---"
echo ""

read -p "Press Enter to start recording..."

asciinema rec assets/demo.cast --cols 80 --rows 24 --idle-time-limit 2

echo ""
echo "Recording saved to assets/demo.cast"
echo "Convert to GIF: agg assets/demo.cast assets/demo.gif --cols 80 --rows 24"
echo "Or use: https://docs.asciinema.org/manual/agg/ for SVG"
