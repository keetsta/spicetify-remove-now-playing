# Remove Now Playing

A [Spicetify](https://spicetify.app) extension that nukes Spotify's right-hand
"Now Playing" sidebar — the panel that auto-opens on startup and pops up every
time you switch tracks.

It hides the panel via CSS and force-closes it whenever Spotify tries to open it.

## Install

1. Copy `removeNowPlaying.js` into your Spicetify extensions folder:
   - **Windows:** `%APPDATA%\spicetify\Extensions\`
   - **Linux/macOS:** `~/.config/spicetify/Extensions/`
2. Enable and apply:

   ```sh
   spicetify config extensions removeNowPlaying.js
   spicetify apply
   ```

## License

[MIT](LICENSE)
