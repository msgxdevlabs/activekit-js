---
---

Remove the vendored `design/` folder and the CI firewall that guarded it.

Those 33k lines were the *app's* design system, referenced by this repo but
never shipped from it — vendored into a public SDK repo and then firewalled
from ever being imported, which is a strong signal it was in the wrong place.
It belongs beside the app it dresses.

The firewall in `scripts/size.mjs` went with it: it existed to stop a `design/`
import reaching a customer's page, and with the folder gone there is nothing to
import. The embeds are unaffected — they always transcribed the token values
rather than importing them, which is exactly why this move costs nothing.
