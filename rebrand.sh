#!/usr/bin/env bash
#
# TRIIOSAN -> TetradCare rebrand
# Renames the product and swaps the orange brand palette for teal.
#
# Run from the repo root:  bash rebrand.sh
# Commit first. This edits files in place.

set -euo pipefail

if [ ! -f package.json ]; then
  echo "Run this from the repo root (no package.json here)."
  exit 1
fi

FILES=$(grep -rl -e 'Triiosan' -e 'TRIIOSAN' -e 'triiosan' -e '\bember\b' \
  --include='*.ts' --include='*.tsx' --include='*.js' \
  --include='*.css' --include='*.json' --include='*.sql' \
  . | grep -v node_modules | grep -v '\.next/')

echo "Editing:"
echo "$FILES" | sed 's/^/  /'
echo

for f in $FILES; do
  # --- product name -------------------------------------------------
  sed -i \
    -e 's/TRIIOSAN/TETRADCARE/g' \
    -e 's/Triiosan/TetradCare/g' \
    -e 's/triiosan/tetradcare/g' \
    "$f"

  # --- colour token name --------------------------------------------
  # \bember\b will not match "remember" or "September".
  sed -i -E 's/\bember\b/teal/g' "$f"

  # --- colour values -------------------------------------------------
  sed -i \
    -e 's/#E8622D/#0F7285/g' \
    -e 's/#C44818/#0B5665/g' \
    -e 's/#F08050/#2E97AB/g' \
    -e 's/#FBF6F0/#F2F7F8/g' \
    "$f"

  # --- CSS custom properties in globals.css --------------------------
  # Whitespace-tolerant. The alignment spacing shifts when 'ember'
  # (5 chars) becomes 'teal' (4), so fixed-space patterns miss.
  sed -i -E \
    -e 's/(--color-teal-dark:[[:space:]]*)196 72 24;/\111 86 101;/' \
    -e 's/(--color-teal:[[:space:]]*)232 98 45;/\115 114 133;/' \
    -e 's/(--color-cream:[[:space:]]*)251 246 240;/\1242 247 248;/' \
    "$f"
done

echo
echo "Done. Now do these four by hand:"
echo
echo "  1. package.json name field is now 'tetradcare'. Confirm it."
echo "  2. src/lib/anthropic/prompts.ts: the model prompt changed."
echo "     Re-run a few triage test cases before trusting the output."
echo "  3. Storage keys are now 'tetradcare-theme' and 'tetradcare_lang'."
echo "     Existing users lose their saved theme and language. Acceptable"
echo "     now, not after launch."
echo "  4. Rename src/lib/anthropic/ to src/lib/ai/ while you are here."
echo "     It holds Google Gemini code, not Anthropic."
echo
echo "Left alone on purpose: the urgency palette."
echo "  routine  #347A66   emergency #C23B22   urgent #D68F24"
echo "  Brand teal #0F7285 sits at hue 194, routine green at hue 157."
echo "  That gap is what keeps urgency readable at a glance. Do not"
echo "  close it by pulling the brand greener."
echo
echo "Then:  npm run build   and check the focus rings, which use ring-teal."