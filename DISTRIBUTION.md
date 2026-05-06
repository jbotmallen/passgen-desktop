# Distribution Guide — Privaulta

Step-by-step walkthrough for producing installable bundles and publishing them so testers can download and try Privaulta immediately.

---

## 1. Decide what you are shipping

`npm run tauri build` produces native installers under
`src-tauri/target/release/bundle/`. Targets are platform-specific:

| Host OS  | Output formats                                           |
|----------|----------------------------------------------------------|
| Windows  | `.msi` (WiX), `.exe` (NSIS)                              |
| macOS    | `.app`, `.dmg` (must be built on macOS)                  |
| Linux    | `.deb`, `.rpm`, `.AppImage`                              |

Tauri can only cross-compile in limited cases — to ship Windows + macOS + Linux you need a build runner per OS (GitHub Actions handles this cleanly, see step 6).

---

## 2. One-time prep

1. **Set a real version.** Edit `src-tauri/tauri.conf.json` (`version`) and `package.json` (`version`). Keep them in sync. Use semver — start `0.1.0` for the first public test build.
2. **Confirm the bundle identifier.** `com.privaulta.app` is fine for a personal project; change it if you fork.
3. **Add icons** (already present under `src-tauri/icons/`). Replace if you rebrand.
4. **(Optional) Code signing.** Unsigned builds work but trigger SmartScreen / Gatekeeper warnings.
   - Windows: an Authenticode certificate (DigiCert, SSL.com, etc., ~$200–$400/yr) avoids the "unknown publisher" warning.
   - macOS: Apple Developer Program ($99/yr) + notarization.
   - Skip signing for an early test release; just warn users in the README (the current README already does).

---

## 3. Build locally

From the repo root:

```bash
npm install
npm run tauri build
```

Outputs land in:

- `src-tauri/target/release/bundle/msi/Privaulta_0.1.0_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/Privaulta_0.1.0_x64-setup.exe`
- (macOS) `…/bundle/dmg/Privaulta_0.1.0_aarch64.dmg`
- (Linux) `…/bundle/appimage/privaulta_0.1.0_amd64.AppImage`

Test the installer on a clean machine (or a fresh user account / VM) before publishing — a fresh box catches missing runtime deps the dev box hides.

---

## 4. Generate checksums

Users (and your README) should be able to verify the download. From the directory containing the bundle:

```powershell
Get-FileHash 'Privaulta_0.1.0_x64-setup.exe' -Algorithm SHA256
```

```bash
# macOS / Linux
shasum -a 256 'Privaulta_0.1.0_x64-setup.exe'
```

Save the output to a `SHA256SUMS.txt` you upload alongside the binaries.

---

## 5. Publish via GitHub Releases (recommended)

GitHub Releases is the path of least friction: free, version-pinned, public, and gives every asset a stable URL.

1. Tag the commit:
   ```bash
   git tag -a v0.1.0 -m "v0.1.0 — first public test build"
   git push origin v0.1.0
   ```
2. On GitHub: **Releases → Draft a new release → choose tag v0.1.0**.
3. Title: `Privaulta 0.1.0 (test build)`. Mark **"This is a pre-release"** for early test builds.
4. In the description, paste:
   - One-line summary.
   - Install instructions per OS (link to README sections).
   - The SHA-256 hashes from step 4.
   - Known issues / "this is unsigned" disclaimer.
5. Drag-and-drop the installers + `SHA256SUMS.txt` into the asset uploader.
6. **Publish.** Each asset gets a permalink:
   `https://github.com/<you>/privaulta/releases/download/v0.1.0/Privaulta_0.1.0_x64-setup.exe`

Link that URL from the README's "Download" section so users land one click away from the file.

---

## 6. Automate with GitHub Actions (optional but worth it)

Manually building three OSes is tedious. The Tauri team maintains a reference workflow:

```yaml
# .github/workflows/release.yml
name: release
on:
  push:
    tags: ['v*']
jobs:
  build:
    strategy:
      matrix:
        platform: [windows-latest, macos-latest, ubuntu-22.04]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: dtolnay/rust-toolchain@stable
      - name: Linux deps
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
      - run: npm ci
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Privaulta ${{ github.ref_name }}'
          releaseDraft: true
          prerelease: true
```

Push a `v*` tag → installers for all three OSes appear as a draft release. Edit notes, publish.

---

## 7. Alternative hosting

| Channel                   | When it makes sense                                                                 |
|---------------------------|--------------------------------------------------------------------------------------|
| **GitHub Releases**       | Default. Free, durable, audited.                                                     |
| **Cloudflare R2 / S3**    | If you want a custom download domain or analytics. Pair with a CDN.                  |
| **itch.io**               | Fast distribution to non-technical testers; supports password-protected pages.       |
| **TestFlight / MS Store** | Skip until you have signing certs and a stable release cadence.                      |

For a first public test, **GitHub Releases is the right answer**. Move only when you outgrow it.

---

## 8. Auto-updates (later)

Tauri has a built-in updater (`tauri-plugin-updater`). It is not wired up in this repo. Once you sign builds and have a stable URL pattern, add:

1. Generate an update keypair: `npm run tauri signer generate`.
2. Add `plugins.updater` config in `tauri.conf.json` with the public key and an `endpoints` array pointing at a JSON manifest (can live in the GitHub Release assets).
3. Have CI generate `latest.json` per release.

Until then, ship "download a new installer" as the upgrade path and document it in release notes.

---

## 9. Pre-release checklist

Before clicking **Publish**:

- [ ] Versions in `tauri.conf.json` and `package.json` match the git tag.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `npm run tauri build` produces a working installer on a clean test account.
- [ ] Installer launches, vault creation works, generator produces output, lock/unlock round-trips a saved entry.
- [ ] SHA-256 hashes recorded.
- [ ] README "Download" link points at the new release tag.
- [ ] Release notes mention: this is unsigned (if true), data is local-only, how to uninstall, where the database lives.

