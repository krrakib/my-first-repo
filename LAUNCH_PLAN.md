# Spriteloom launch plan: from zero to $5,000/month

You follow these steps in order. Each step says exactly what to click.
Anything that needs code, new sprites or new packs: ask Claude.

---

## 0. The honest numbers first

The model we copied, **Polyfork** (polyfork.dev), did **not** make $500,000 per month.
It won a **one-time $500,000 prize** (the Build with Gemini XPRIZE). Its real revenue was
**$4,428 in the first month from 54 paying customers**. Their creator is an experienced
design engineer who worked on it full time and posted progress publicly every day.

So $5,000/month is realistic, but:

- **Month 1 is usually $0-$300.** That is normal. Don't quit.
- Expect **6-12 months** of steady work to reach $5,000/month.
- The money comes from **shipping new packs often** and **posting every day**, not from the website alone.

What $5,000/month looks like:

| Source | Price | Sales/month needed |
|---|---|---|
| "All packs" bundle | $29 | 100 → $2,900 |
| Single packs | $9 | 150 → $1,350 |
| Commissions and custom packs (later) | ~$150 | 5 → $750 |
| **Total** | | **≈ $5,000** |

(Stores keep a cut: itch.io lets you choose, 10% by default; Gumroad and Lemon Squeezy take roughly 5-10%.)

---

## 1. What you have (already built)

- **Website** (`index.html`): a free sprite generator with 12 generators (creatures, spaceships,
  potions, weapons, gems, keys, chests, shields, trees, rocks, mushrooms, terrain tiles),
  plus a pack shop, pricing and FAQ. It runs entirely in the browser, so hosting is free.
- **4 paid packs, 920 sprites**: Dungeon Loot, Monster Mob, Space Fleet and Overworld,
  plus an All-Packs bundle. Each zip has PNGs at 1x and 4x, spritesheets, JSON atlases,
  a cover image, a license and a readme.
- **`assets/config.js`**: the only file you edit (store links and prices).

The zip files are **not** in the GitHub repo on purpose: the repo is public and you don't want
people downloading paid packs for free. Claude sends you the zips in chat. To rebuild them yourself:
install Node.js 22+, then run `node scripts/build-packs.mjs` (the output goes in `dist/`).

---

## 2. Put the website online (free, about 10 minutes)

1. On GitHub, open your repo **krrakib/my-first-repo**.
2. Merge the branch `ccr-b79976ee-mmsywe` into `main`
   (**Pull requests → New pull request → base: main, compare: ccr-b79976ee-mmsywe → Create → Merge**).
3. Optional but recommended: **Settings → General → Repository name** → rename it to `spriteloom`.
4. **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main**, folder **/ (root)** → **Save**.
5. Wait 1-2 minutes. Your site will be at `https://krrakib.github.io/<repo-name>/`.
6. Later, when you have money coming in, buy a domain (for example `spriteloom.com`, about $10/year)
   and add it under **Settings → Pages → Custom domain**.

> GitHub Pages is free for public repositories. If the repo is private, make it public first
> (Settings → General → Danger Zone → Change visibility).

---

## 3. Start selling on itch.io (main store, about 1 hour)

itch.io is where indie game developers buy assets, so you get buyers without paying for ads.

1. Sign up at **itch.io**.
2. **Settings → Payouts**: connect the payout method itch.io offers in your country
   (PayPal or Payoneer). Choose **"Collected by itch.io, paid out later"**: itch.io then
   handles VAT and taxes for you.
3. **Dashboard → Create new project**, once per pack:
   - **Title:** `Dungeon Loot: 368 Pixel-Art RPG Items (16x16)` (put the count and size in the title)
   - **Kind of project:** `Assets`
   - **Pricing:** `Paid` → **$9** (tick "Allow people to pay more")
   - **Uploads:** the pack's `.zip`
   - **Cover image:** the pack's `*-cover.png`
   - **Screenshots:** open the zip, take `sheets/*@4x.png`, and upload 3-5 of them
   - **Description:** copy from the template below
   - **Genre/Tags** (use all 10): `pixel-art`, `16x16`, `sprites`, `2d`, `rpg`, `roguelike`,
     `asset-pack`, `godot`, `unity`, `items` (adjust for each pack)
   - **Visibility:** `Public` → **Save**
4. Create one more project, **"Spriteloom: All Packs (Lifetime)"**, at **$29** with the
   `spriteloom-all-packs.zip`. When a new pack comes out, **replace that zip**: past buyers can
   download the new version for free. That is how "future packs included" works.
5. Copy each project's link (for example `https://krrakib.itch.io/dungeon-loot`) and paste it into
   `assets/config.js` on GitHub (open the file → pencil icon → paste → **Commit changes**).
   The "Coming soon" buttons on the site become "Buy" buttons.

**Description template:**

```
368 hand-picked pixel-art items for RPGs and roguelikes: potions, swords, axes, staffs,
gems, keys, chests and shields. Matching style, 16x16, ready to drop in.

WHAT'S INSIDE
• 368 PNG sprites at 1x (16x16) and 4x (64x64)
• Spritesheets + JSON atlas (Phaser, PixiJS, Godot, Unity)
• Commercial license, no credit required

Want different colors? Remix any sprite for free at <your site link>

Works with Godot, Unity, GameMaker, Phaser, RPG Maker, Love2D, Pygame...
```

**Second store (optional, week 3):** Gumroad or Lemon Squeezy, for buyers who come from the website.
Both handle payments and taxes for you. Sell the same zips at the same prices.

---

## 4. Get your first 100 visitors (week 1-2)

Do **one post per day**. Every post shows sprites, because pixel art sells itself visually.

| Day | Where | What to post |
|---|---|---|
| 1 | Reddit r/gamedev (on Saturdays: the "Screenshot Saturday" thread) | "I made a free pixel sprite generator: every sprite is a program with knobs" + GIF + link |
| 2 | Reddit r/godot, r/Unity2D, r/IndieDev | Same, adapted. Read each subreddit's rules first: most allow self-promo if you are helpful |
| 3 | X/Twitter + Bluesky, tags #pixelart #gamedev #indiedev | A 10-second screen recording of turning the knobs |
| 4 | Hacker News "Show HN" | `Show HN: Procedural pixel-art sprites you can remix in the browser`. HN likes the technical angle |
| 5 | itch.io community forum: "Asset Creators" / "Release Announcements" | Pack announcement |
| 6 | YouTube Shorts / TikTok | "I generated 900 game sprites with code" (screen recording) |
| 7 | Reply to people asking for free assets on Reddit (search "need sprites") | Helpful answer + link to the free generator |

**Most powerful trick: game jams.** Every week itch.io hosts game jams with hundreds to thousands
of developers. Message the jam host: *"I'd like to offer my pack free to all participants."*
Give out a free download key (itch.io → your project → Distribute → Download keys).
Jam games credit you, people see your sprites everywhere, and many come back to buy the bundle.
**Aim for 1 jam per week.**

---

## 5. Weekly routine (this is the real job)

- **Every day (30-60 min):** 1 post with sprites, and reply to every comment.
- **Every 2-3 weeks:** release a **new pack**. Ask Claude: *"Build the next pack: <idea>"*.
  Each new pack = a new itch.io page = new search traffic + a reason to post again.
- **Every month:** run a sale (itch.io → Create sale, 30-50% off for 3 days) and join itch.io's
  site-wide sales events when they're announced.
- **Every Sunday:** fill in the numbers table below.

**Next pack ideas, ranked by demand:**
1. Animated characters (idle + walk cycles): animation is what people struggle with most
2. Platformer tileset with corners/autotile
3. UI kit: buttons, panels, hearts, health bars
4. Food & farming (cozy games are hugely popular)
5. Furniture & interiors
6. Spell effects & particles
7. 32x32 weapons and armor

---

## 6. Numbers to track (every Sunday)

| Week | Site visitors | itch.io views | Sales | Revenue | What I posted |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |

Rough benchmarks: 2-3% of itch.io page views buy something. To sell 250 items/month you need
roughly **10,000 page views/month**. That's why posting daily and releasing packs often matter so much.

---

## 7. Later (months 3-6), once sales start

- **More SEO pages**: one page per sprite type ("free pixel art potions", "free 16x16 trees"),
  the same approach Polyfork uses to get Google traffic. Ask Claude to generate them.
- **AI-agent / developer API**: a package so tools like Claude Code and Cursor can generate
  sprites directly inside game projects (Polyfork's MCP-server idea).
- **Pro subscription** ($5/month) for bulk export and new monthly packs, once you have 300+ buyers.
- **Custom packs for studios** ($150-$500): "sprites in your game's palette".

---

## 8. Rules

1. **Never** upload the paid zips to GitHub (the repo is public).
2. Reply to every buyer within 24 hours. Reviews and word of mouth decide everything here.
3. Don't spam. One helpful post beats ten "buy my stuff" posts, and spam gets you banned from Reddit.
4. Keep going for at least 6 months before deciding whether it works.
