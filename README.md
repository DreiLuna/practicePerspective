# Delay

Live camera feed on a short delay, so athletes feel the rep first and watch it after.
See [CONTEXT.md](CONTEXT.md) for design principles, architecture, and scope.

## Launch

Double-click **Start Delay (Windows).bat** or **Start Delay (Mac).command**. It installs
dependencies on first run, builds the app, and opens it at http://localhost:5173. Close the
window to stop it. Needs [Node.js](https://nodejs.org) (LTS).

On a Mac, the first time: right-click the `.command` file → Open → Open, since macOS blocks
unsigned scripts on a plain double-click. If it says it isn't executable, run
`chmod +x "Start Delay (Mac).command"` once in Terminal.

## Develop

```bash
npm install
npm run dev       # http://localhost:5173
npm run dev:lan   # HTTPS on your local network, for testing on a tablet
npm test          # unit tests (ring buffer)
```
