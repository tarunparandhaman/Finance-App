# Finance Tracker

A simple, mobile-friendly personal finance tracker: Indian stocks, US stocks,
mutual funds, PF (EPF), NPS, and other assets (FD/gold/cash/real estate) — all
in one place.

## How it works

- **No account, no login.** Everything you add is saved in your browser's
  local storage only — nothing is sent to any server or database.
- Because there's no server-side copy of your data, use **Settings → Export
  backup** regularly. That saves a `.json` file you can keep safe and reload
  later with **Import backup** (e.g. if you clear your browser data or switch
  devices).
- Stock prices and mutual fund NAVs are fetched live from public sources
  (Yahoo Finance and mfapi.in) through a couple of small routes in `app/api/`.
  Those routes only fetch public price data — none of your personal holdings
  ever leave your browser.

## Running it on your own computer

1. Open a terminal in this folder.
2. Install dependencies (only needed once, or after pulling new changes):
   ```bash
   npm install
   ```
3. Start it:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

To try it on your phone on the same Wi-Fi, use your computer's local network
address that `npm run dev` prints out (something like
`http://192.168.x.x:3000`) instead of `localhost`.

## Putting it online (hosting it live)

The easiest free option for this kind of app is
[Vercel](https://vercel.com) (made by the creators of Next.js):

1. Push this folder to a GitHub repository (already done if you're reading
   this from GitHub).
2. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and
   import this repository.
3. Leave all settings as default and click **Deploy**.
4. Vercel gives you a live URL (e.g. `your-app.vercel.app`) you can open from
   any device, including your phone. You can add it to your phone's home
   screen for an app-like feel (it's a PWA).

Remember: even once it's live, your data still only lives in *your own
browser* on whichever device you're using — it doesn't sync between devices
unless you export/import a backup.

## Tech stack

Next.js (App Router, TypeScript), Tailwind CSS, zustand (local storage
persistence), Recharts.
