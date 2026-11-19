Put generated exercise images here, named as in `DEMO-PROMPTS.md` (for example `squat-a.png`
and `squat-b.png`), then run `python3 scripts/process_demos.py`. It cuts the person out of each
photo, matches size, brightness and background across all of them, adds mirrored frames for moves
that alternate sides, and writes `public/demo/` plus `src/data/demos.json`.

The originals are large and are not committed (see `.gitignore`); keep your own copy.
