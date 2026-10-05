# How to publish an update (keep this file)

Your repository: https://github.com/dineshmotorindia/Dheena-Your-Personal-Assistant
Share this link with users: https://github.com/dineshmotorindia/Dheena-Your-Personal-Assistant/releases/latest

## Every time you change something
1. **Test.** In the black window (opened inside D:\Personal Assistant): `npm run debug`. Check it works.
2. **Raise the version.** Open package.json in Notepad, change `"version": "1.0.1"` to the next number (1.0.2, 1.0.3, 1.1.0...). It must always be higher than the last release.
   Check the `"files"` list contains: main.js, preload.js, index.html, renderer.js, knowledge.js, vendor/**, character.glb
3. **Back up the code.** GitHub Desktop > write a short message > Commit to main > Push origin.
4. **Make a fresh token.** github.com > profile picture > Settings > Developer settings > Personal access tokens > Tokens (classic) > Generate new token (classic). Expiration 30 days, tick "repo", Generate, copy it. Never paste it in chats or screenshots.
5. **Upload.** Double-click release.bat, type y, paste the token, press Enter. Wait until it says Finished (no red text).
   Manual way: black window > `set GH_TOKEN=your_token` then `npm run release`.
6. **Publish.** GitHub > Releases > open the Draft > Edit. Assets must show: Pocket-Assistant-Setup-x.x.x.exe and latest.yml (.blockmap is optional).
   If a file is missing (or there are two drafts), drag it in from the dist folder (use dashes in the .exe name, no spaces). Keep "Set as the latest release" ticked. Click **Publish release**.
7. **Check.** Open the /releases/latest link in a private window: the new version and its files must show.
8. **Delete the token** (Settings > Developer settings > Tokens > Delete).

## What users get
Installed apps check for updates when they start and every 6 hours. The update downloads in the background and installs when the app is closed and opened again (right-click him > Quit, then start him again).
New users just download the .exe from the /releases/latest link.

## Problems
- "tag already exists" or nothing happens: you forgot to raise the version.
- 404 error: owner/repo in package.json "publish" is wrong, or the token lacks "repo".
- EBUSY error: run `taskkill /F /IM electron.exe`, delete the dist folder, add D:\Personal Assistant to antivirus exclusions, run again.
- Draft shows no .exe: drag it in from the dist folder by hand.
