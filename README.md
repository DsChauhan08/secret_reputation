# Secret Reputation

## What is it?
Secret Reputation is an anonymous, multiplayer party game that thrives on chaos, radical honesty, and a little bit of drama. It's a mobile game where you join a virtual room with your friends and vote on who is the "most likely to..." for wildly specific, tailored prompts. The catch? Every vote is completely anonymous.

## Why should you play it?
Because everyone has a secret reputation among their friends, and this game is the ultimate way to figure out what yours is. Secret Reputation strips away the politeness and lets your friends expose what they really think about you based on real group dynamics. It's the perfect icebreaker, a brilliant way to laugh at yourselves, and a guaranteed catalyst for unforgettable stories (and probably a few harmless arguments). With an instantly familiar, extremely minimal iOS-like design, it gets out of its own way so the focus stays entirely on the fun.

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
- Once the Host taps **Start Game**, everyone's screen will sync to the first Category (e.g., *"Most likely to start a cult accidentally"*).
- Each player secretly selects the friend they think best fits the prompt. 
- *Note: You cannot vote for yourself!*

### 4. The Reveal
- Once all votes are securely locked in, the results are calculated.
- The app will automatically reveal the winner, the runner-up, and exact vote breakdowns.
- The game will generate custom commentary assessing how unanimous or split the group's opinion was.

### 5. Final Results
- At the end of all rounds, the app will display a summary of everyone's "Secret Reputation."
- You can generate beautiful sharing cards to post your results, or instantly jump back into the lobby with a new vibe.

---

*This application relies on a Cloudflare Workers backend and a React Native (Expo) frontend.*

## Local Mobile Dev

Run Expo from the mobile workspace (or use root helper scripts):

```bash
# Recommended (from repo root)
bun run mobile:start:clear

# Equivalent direct command
cd apps/mobile && bun x expo start --clear
```

## Release Guide (Android APK/AAB + iOS IPA)

### CI automation (recommended)

This repo includes GitHub Actions workflow `mobile-release.yml` that builds all release artifacts in parallel using EAS Build and uploads them to the matching GitHub Release.

Set these **GitHub repository secrets**:

- `EAS_TOKEN` (**required**, from your Expo account)
- `EXPO_PUBLIC_WS_URL`
- `EXPO_PUBLIC_POSTHOG_KEY`
- `EXPO_PUBLIC_POSTHOG_HOST` (usually `https://us.i.posthog.com`)

How it runs:

- Publishing a GitHub Release triggers all three builds automatically.
- Manual run via **Actions → Mobile Release Build** is also supported (optionally pass `release_tag`; otherwise latest release tag is used).
- The workflow syncs secrets into the EAS `production` environment, then runs three parallel jobs:
  - **Android AAB** (`production` profile) → uploads `secret-reputation-<tag>.aab`
  - **Android APK** (`production-apk` profile) → uploads `secret-reputation-<tag>.apk`
  - **iOS IPA** (`production-ipa` profile) → uploads `secret-reputation-<tag>.ipa`
- Build metadata is saved as workflow artifacts and a summary table is shown in the job.

> **Note:** iOS builds require Apple Developer credentials configured in your EAS dashboard.
> Android builds work independently of iOS.

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
# Android internal testing APK (preview env)
bun run build:android:preview

# Android production APK (for GitHub release asset)
bun run build:android:apk

# Android production AAB (for store distribution)
bun run build:android:production

# iOS production IPA (ad-hoc distribution)
bun run build:ios:ipa

# iOS production archive (App Store / TestFlight)
bun run build:ios:production
```

### 4) Create GitHub release
After EAS build URLs/artifacts are available, create release notes and attach binaries:

```bash
gh release create v1.1.0 \
  --title "Secret Reputation v1.1.0" \
  --notes "Clean release pipeline with parallel APK/AAB/IPA builds." \
  release-assets/secret-reputation-v1.1.0.apk \
  release-assets/secret-reputation-v1.1.0.aab \
  release-assets/secret-reputation-v1.1.0.ipa
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

### Local prerequisites (for F-Droid validation)

Install `fdroidserver` and Android SDK build tools on your machine:

```bash
python3 -m pip install --user fdroidserver

mkdir -p "$HOME/Android/Sdk/cmdline-tools/latest"
curl -L "https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip" \
  -o "$HOME/Android/Sdk/commandlinetools-linux.zip"
unzip -q "$HOME/Android/Sdk/commandlinetools-linux.zip" -d "$HOME/Android/Sdk/cmdline-tools/latest"
mv "$HOME/Android/Sdk/cmdline-tools/latest/cmdline-tools"/* "$HOME/Android/Sdk/cmdline-tools/latest/"
rmdir "$HOME/Android/Sdk/cmdline-tools/latest/cmdline-tools"

export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/build-tools/35.0.0:$PATH"

yes | sdkmanager --licenses
sdkmanager "platform-tools" "build-tools;35.0.0" "platforms;android-35"
```

Verify APK signer fingerprint (used for `AllowedAPKSigningKeys`):

```bash
apksigner verify --print-certs release-assets/secret-reputation-v1.1.0.apk
```

#### F-Droid submission (proper prep, excluding screenshots)
This repository already includes F-Droid/fastlane starter metadata at:

- `fastlane/metadata/android/en-US/title.txt`
- `fastlane/metadata/android/en-US/short_description.txt`
- `fastlane/metadata/android/en-US/full_description.txt`
- `fastlane/metadata/android/en-US/changelogs/1.txt`
- `fdroid/metadata/com.secretreputation.app.yml`

Before opening your `fdroiddata` merge request, complete the following:

1. **Cut optimized release tag** (recommended: `v1.1.0+`) and upload the optimized APK.
2. **Extract signer fingerprint** from that APK and set `AllowedAPKSigningKeys` in
   `fdroid/metadata/com.secretreputation.app.yml`:

   ```bash
   apksigner verify --print-certs secret-reputation-vX.Y.Z.apk
   ```

   Use the SHA-256 cert fingerprint as lowercase hex without colons.

3. **Validate metadata + build recipe in fdroiddata**:
   - Add `metadata/com.secretreputation.app.yml` in your `fdroiddata` fork.
   - If your local `fdroid lint` complains about unknown categories, add local config at
     `fdroid/config/categories.yml` (already included in this repo for local linting).
   - Run `fdroid readmeta`, `fdroid lint com.secretreputation.app`, and
     `fdroid build com.secretreputation.app` in the official buildserver container.
4. **Open MR to fdroiddata** (or open `fdroid/rfp` first if you prefer reviewer guidance).

Screenshots can be added later under:
`fastlane/metadata/android/en-US/images/phoneScreenshots/`

### Current release assets (v1.1.0)
- APK: https://github.com/DsChauhan08/secret_reputation/releases/download/v1.1.0/secret-reputation-v1.1.0.apk
- AAB: https://github.com/DsChauhan08/secret_reputation/releases/download/v1.1.0/secret-reputation-v1.1.0.aab
- IPA: https://github.com/DsChauhan08/secret_reputation/releases/download/v1.1.0/secret-reputation-v1.1.0.ipa

Note: iOS `.ipa` is ad-hoc distribution (requires registered device UDIDs). For App Store distribution, use the `production` build profile via EAS and submit through App Store Connect.

## Automated gameplay tests (no multiple phones required)

You can test full room flow (create, join, start, vote, reveal, leave/reconnect cases)
using simulated WebSocket clients from one machine.

From `apps/worker`:

```bash
bun run test:e2e
```

Optional target override (if not using the default deployed worker URL):

```bash
WS_URL="wss://your-worker.example.workers.dev" \
HTTP_URL="https://your-worker.example.workers.dev" \
bun run test:e2e
```

The E2E suite now includes leave-flow coverage for:
- player leaving during an active voting round (votesRequired adjusts correctly)
- host leaving and reconnecting with reconnect token (room/game state preserved)
