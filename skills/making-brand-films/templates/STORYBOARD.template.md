# Storyboard: <film name>

- Film: <films/name>
- Hook (first 3 s): <what the viewer sees and reads in 0-3 s that makes them stay>
- Total length (s): <number; target 15-30, under 15 also works>
- Brand feeling: <one or two words, e.g. calm, premium>
- Sound-off check: mute the film; the on-screen text alone still carries this beat's part of the message.
- Hook check: by 3 s the viewer knows what this is, who it is for and why to keep watching.

## Shot table

| # | start-end (s) | what the viewer sees (max 8 words) | motion / easing (max 5 words) | on-screen text (verbatim) | sound / music cue (max 4 words) | transition (cut, max 3 words) |
|---|---|---|---|---|---|---|
| 1 | 0-3 | HOOK: <the image that stops the scroll> | <slow push-in, ease-out> | <question or pun, readable on frame 0> | <soft piano enters> | cut in |
| 2 | 3-9 | BUILD: <product in use> | <spring rise, 0.4 s> | <one idea per beat> | <piano, mist SFX> | <0.5 s dissolve> |
| 3 | 9-14 | PAYOFF: <product hero> | <float, ease-in-out> | <product name, one proof point> | <piano, cap click> | <bloom to end card> |
| 4 | 14-18 | CTA: <end card, wordmark, URL> | <letter-spacing settle> | <wordmark, URL> | <swell resolves> | end |

## Notes

- The contact sheet is for fast review and shows only the beat number, time, on-screen text, `sees` and `sound`: keep those cells within the word limits in the column hints (`storyboard.py sheet` warns). Motion, cut and these notes stay in this file.
- One row per beat: hook, build, payoff, CTA. Beats of 1.5-3 s read well; a beat longer than 4 s needs a reason.
- Keep start-end contiguous (each start = previous end) and the last end = total length.
- `storyboard.py sheet` renders each beat at its midpoint, so write the row for what the viewer sees mid-beat, not at the cut.
- Text and key subjects stay inside the phone safe zone (toggle it on the contact sheet).
