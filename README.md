# cuddly-roses

A romantic, password-protected memory website built for sharing photos, letters, and special milestone moments.

## What it includes
- A lock screen with a 6-digit PIN
- A home hub with a photo strip and navigation cards
- A gallery of favorite memories
- A “14 reasons” page for heartfelt messages
- A memory game and a memory vault
- A special letter experience unlocked with a 4-digit PIN

## Project structure
- index.html — landing page and hub
- reasons.html — reasons page
- surprise.html — memory game page
- letters.html — letter collection and special letter unlock
- gallery.html — photo gallery
- vault.html — memory vault
- add.html — add a memory form
- script.js — shared page behavior
- styles.css — theme, layout, and styling
- netlify/functions/check-pin.js — PIN verification function
- netlify/functions/check-special-pin.js — special letter PIN verification function

## Setup
1. Open the project in a browser or host it with Netlify.
2. Make sure the images live in the images/ folder.
3. Set the Netlify environment variable `SPECIAL_PIN` for the special letter flow.

## Notes
- The gallery and homepage pull images from the images/ folder.
- Memories added through the form are stored in localStorage in the browser.
- The special letter content is currently embedded in the page and protected by the PIN flow.
