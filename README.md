# MIDAS — shared team edition

See TEAM-SETUP.md for deployment, sign-in, imports, recovery and testing instructions. Upload every file here including vendor/ to the existing GitHub Pages publishing folder.

This edition connects to Supabase and starts with an empty library. The original standalone edition and its saved browser data are preserved separately.


## Orbital observatory

`orbits.html` renders real SatNOGS two-line elements using satellite.js SGP4 and Three.js. Orbital data is CC BY-SA 4.0; see orbit-data/LICENSE.md. This is a catalogue subset, not complete orbital coverage or live telemetry. Elements older than 14 days and failed/decayed propagation are hidden.

GitHub Actions refreshes the catalogue every four hours. The page loads the latest snapshot from the public repository (with a bundled fallback), so bot updates do not require a Pages rebuild. Refresh the browser to fetch newer elements. Failed updates preserve the last good snapshot; a 401/403/429 blocks further requests until the provider restrictions are reviewed and orbit-data/update-status.json is cleared. GitHub can delay or disable inactive scheduled workflows.
