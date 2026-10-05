# Pocket Assistant (desktop) : free to share, only you can update

## Try it on your computer
1. Install Node.js (nodejs.org).
2. In this folder run: `npm install` then `npm start`. The wizard appears at the bottom-right of your screen.
   Click him to type, drag him anywhere, right-click for Start at login / Quit.

## Publish it worldwide (free)
1. Create a free GitHub account and a PUBLIC repository named `pocket-assistant`.
2. In package.json replace YOUR-GITHUB-NAME (and YOUR NAME). Upload the project to the repository (do not upload node_modules).
3. GitHub > Settings > Developer settings > Personal access tokens: make a token with "repo" access. Keep it secret.
4. Build and publish a release:
   - Windows PowerShell:  `$env:GH_TOKEN="your-token"; npm run release`
   - Mac/Linux:           `GH_TOKEN=your-token npm run release`
   Build each system on its own computer (Windows installer on Windows, DMG on Mac, AppImage on Linux).
5. Share your repository's Releases page. People download the installer and run it.

## Updating (only you)
Raise "version" in package.json (for example 1.0.1) and run `npm run release` again.
The app checks for updates on launch and every 6 hours. Only someone holding your GitHub token can publish releases.
Turn on two-factor login for GitHub and never share the token.

## Honest limits
- Windows shows a "SmartScreen" warning for unsigned apps (click More info > Run anyway). A code-signing certificate removes it but costs money.
- Mac auto-update needs an Apple Developer account (paid). Without it, Mac users reinstall manually. Windows and Linux auto-update work.
- Always-on-top overlay on Linux needs a desktop that supports transparent windows; click-through of empty space is not available on Linux.
