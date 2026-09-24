---
"@activekit/js": minor
---

`SubjectSnapshot` carries `streak`, the activity streak the platform serves on `GET /v1/me/progress` since contract 0.1.2: `{ current, longest }`, the consecutive UTC days ending today or yesterday on which a daily objective's completion paid the subject XP, and the best such run. It is a different thing from a campaign's `streak` goal, which counts the days one campaign's criteria matched. `current` reads 0 for a subject the daily slot has never paid and once a day is missed, so a surface draws a chip at 0 rather than hiding it. `longest` is the best run among the newest 730 such days the platform reads rather than over all time, so it can fall only once a subject has more than two years of them.

A field added to a public type, so a minor. The bindings re-export `SubjectSnapshot` and gain the field with it, which the internal dependency bump carries. No runtime code changes, so no bundle moves.
