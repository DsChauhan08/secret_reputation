# Secret Reputation

## What is it?
Secret Reputation is an anonymous, multiplayer party game that thrives on chaos, radical honesty, and a little bit of drama. It's a mobile game where you join a virtual room with your friends and vote on who is the "most likely to..." for wildly specific, tailored prompts. The catch? Every vote is completely anonymous.

## Why should you play it?
Because everyone has a secret reputation among their friends, and this game is the ultimate way to figure out what yours is. Secret Reputation strips away the politeness and lets your friends expose what they really think about you based on real group dynamics. It’s the perfect icebreaker, a brilliant way to laugh at yourselves, and a guaranteed catalyst for unforgettable stories (and probably a few harmless arguments). With an instantly familiar, extremely minimal iOS-like design, it gets out of its own way so the focus stays entirely on the fun.

## Guide to Play

### 1. Host a Game
- Open the app and tap **Create Room**.
- Pick your Player Name and a Color that represents you.
- Pick a Room Vibe (controls how ruthless the categories get):
  - **Light Roast**: Funny and harmless. Perfect for newer friend groups.
  - **Normal Chaos**: Sharp but survivable. Good for established groups.
  - **Unhinged**: Full send, no safety net. Feelings might get hurt.
- Once created, the app will give you a **6-character Room Code**.

### 2. Join a Game
- Have your friends open the app and tap **Join Room**.
- They will need to pick their own Name and Color, then enter your **Room Code**.
- Everyone will gather in the Lobby.

### 3. The Voting Phase
- Once the Host taps **Start Game**, everyone’s screen will sync to the first Category (e.g., *"Most likely to start a cult accidentally"*).
- Each player secretly selects the friend they think best fits the prompt. 
- *Note: You cannot vote for yourself!*

### 4. The Reveal
- Once all votes are securely locked in, the results are calculated.
- The app will automatically reveal the winner, the runner-up, and exact vote breakdowns.
- The game will generate custom commentary assessing how unanimous or split the group’s opinion was.

### 5. Final Results
- At the end of all rounds, the app will display a summary of everyone's "Secret Reputation."
- You can generate beautiful sharing cards to post your results, or instantly jump back into the lobby with a new vibe.

---

*This application relies on a Cloudflare Workers backend and a React Native (Expo) frontend.*

## Release Guide (Android APK/AAB + iOS + OSS Store)

### 1) Deploy backend worker
From `apps/worker`:

```bash
bun x wrangler deploy
```

### 2) Log in to Expo EAS
From `apps/mobile`:

```bash
bun x eas-cli login
```

### 3) Build release artifacts
From `apps/mobile`:

```bash
# Android internal testing APK
bun run build:android:preview

# Android production AAB
bun run build:android:production

# iOS production archive
bun run build:ios:production
```

### 4) Create GitHub release
After EAS build URLs/artifacts are available, create release notes and attach APK (or include build URLs):

```bash
gh release create v1.0.0 \
  --title "Secret Reputation v1.0.0" \
  --notes "Initial public release with chaos cards, tie-break transparency, and shared custom question vault." \
  <path-to-apk>
```

### 5) Open-source app store publication

#### Recommended fast path: IzzyOnDroid
- Host signed APK in GitHub Releases.
- Ensure app is FOSS and source is public (already true).
- Submit repository + latest release URL to IzzyOnDroid index maintainers.
- Reuse template: `.github/ISSUE_TEMPLATE/izzyondroid-submission.md`

#### F-Droid readiness checklist
- Stable, reproducible tag-based builds.
- No proprietary tracking SDKs.
- Build metadata and recipe (`metadata/*.yml`) prepared in F-Droid data repo.
- Keep release tags and changelogs consistent.
- Repo metadata starter: `.github/fdroid-metadata.yml`

### Current release assets (v1.0.0)
- APK: https://github.com/DsChauhan08/secret_reputation/releases/download/v1.0.0/secret-reputation-v1.0.0.apk
- AAB: https://github.com/DsChauhan08/secret_reputation/releases/download/v1.0.0/secret-reputation-v1.0.0.aab

Note: iOS binaries are distributed through TestFlight/App Store Connect, not open-source Android stores.
