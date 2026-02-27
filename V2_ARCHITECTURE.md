# OpenClaw Installer V2 Architecture

## V2 Goals

1. **Offline-First Installation** - Bundle OpenClaw source + dependencies for users without GitHub/npm access
2. **Enhanced UX** - Language selection at welcome screen, better error handling
3. **Advanced Management** - Model switching, parameter tuning, auto-troubleshooting
4. **Cross-Platform** - Windows + macOS support with identical features

## Key Differences: V1 vs V2

| Feature | V1 (Online) | V2 (Offline-First) |
|---------|-------------|-------------------|
| OpenClaw Source | Download from GitHub | Bundled in installer |
| Dependencies | Download from npm/Docker Hub | Bundled installers + tarballs |
| Network Requirement | Required | Optional (fallback to online) |
| Installer Size | ~10MB | ~200-300MB |
| Language Selection | Auto-detect | Welcome screen choice |
| Model Management | Basic config | Advanced switching + params |
| Troubleshooting | Manual | Auto-detect + one-click fix |

## V2 Architecture Components

### 1. Bundled Resources (`src-tauri/resources/`)

```
resources/
├── openclaw/
│   └── openclaw-v1.2.3.tar.gz          # Latest OpenClaw release
├── installers/
│   ├── node-v22.x-win-x64.msi          # Node.js installer (Windows)
│   ├── node-v22.x-darwin-x64.pkg       # Node.js installer (macOS Intel)
│   ├── node-v22.x-darwin-arm64.pkg     # Node.js installer (macOS Apple Silicon)
│   └── DockerDesktop-win.exe           # Docker Desktop (Windows only)
├── npm-cache/
│   └── openclaw-deps.tar.gz            # Pre-downloaded npm dependencies
└── mirrors.json                         # Mirror URLs for China users
```

### 2. Installation Flow (Offline Mode)

```
Welcome (Language Select)
  ↓
Environment Detection
  ↓
Mode Selection (npm / Docker)
  ↓
Dependency Installation
  ├─ Try bundled installers first
  ├─ Fallback to online download if bundle missing
  └─ Manual guide if both fail
  ↓
OpenClaw Installation
  ├─ Extract bundled openclaw-v1.2.3.tar.gz
  ├─ Install from bundled npm-cache
  └─ Fallback to npm install if needed
  ↓
Model Configuration (with live switching)
  ↓
Platform Configuration
  ↓
Installation Complete
  ↓
Dashboard (with auto-troubleshooting)
```

### 3. New Features

#### 3.1 Language Selection (Welcome Screen)
- Move from auto-detect to explicit user choice
- Show flags + language names (中文 / English)
- Persist choice in config

#### 3.2 Enhanced Dependency Detection
- Check Node.js version compatibility (22.x required)
- Detect npm global path issues
- Verify Docker daemon status (not just Docker Desktop installed)
- Check WSL2 version and integration
- Validate disk space for bundled resources

#### 3.3 Model Management UI
```typescript
interface ModelManagementFeatures {
  switching: {
    dropdown: "Quick model selector with live preview",
    comparison: "Side-by-side model comparison",
    favorites: "Pin frequently used models"
  },
  parameters: {
    editor: "Visual slider + text input for temp, max_tokens, top_p",
    presets: "Save/load parameter profiles (Creative, Balanced, Precise)",
    validation: "Real-time validation with provider limits"
  },
  monitoring: {
    usage: "Token usage tracking per model",
    performance: "Response time + success rate",
    cost: "Estimated cost per request"
  }
}
```

#### 3.4 Auto-Troubleshooting System
```typescript
interface TroubleshootingFeatures {
  detection: {
    portConflicts: "Detect if 18789 is occupied",
    permissions: "Check file/folder permissions",
    missingDeps: "Verify all dependencies present",
    configErrors: "Validate config.json syntax"
  },
  fixes: {
    oneClickFix: "Auto-fix button for each issue",
    rollback: "Restore previous working config",
    logs: "User-friendly error explanations"
  },
  healthCheck: {
    dashboard: "System health overview",
    alerts: "Proactive warnings before failures"
  }
}
```

### 4. macOS Port Considerations

#### 4.1 Rust Command Changes
- Replace Windows paths (`C:\`, `\`) with Unix paths (`/`, `~`)
- Use `brew` instead of `choco` for package management
- Replace Windows services with `launchd` plist files
- Handle macOS permissions (Gatekeeper, notarization)

#### 4.2 macOS-Specific Features
- Support both Intel and Apple Silicon
- Use `arch -x86_64` for Rosetta compatibility
- Handle macOS Keychain for API key storage
- Support macOS dark mode detection

#### 4.3 CI/CD for macOS
- Add GitHub Actions workflow for macOS builds
- Sign and notarize .app bundle
- Create .dmg installer with drag-to-Applications

### 5. Build Configuration

#### 5.1 Tauri Config Updates
```json
{
  "bundle": {
    "resources": [
      "resources/**/*"
    ],
    "windows": {
      "nsis": {
        "compressionLevel": "ultra"
      }
    },
    "macOS": {
      "minimumSystemVersion": "12.0",
      "frameworks": [],
      "entitlements": "entitlements.plist"
    }
  }
}
```

#### 5.2 Installer Size Optimization
- Use LZMA compression for bundled resources
- Lazy-load resources (download on-demand if not bundled)
- Separate "lite" (online) and "full" (offline) installers

### 6. Migration Path

Users can choose between V1 and V2:
- **V1 (Lite)**: ~10MB, requires internet, faster download
- **V2 (Full)**: ~200-300MB, works offline, slower download

Both versions maintained in separate branches:
- `main` (v1.x) - Online installer
- `v2-dev` (v2.x) - Offline-first installer
- `v2-macos` (v2.x) - macOS port

## Implementation Plan

### Phase 1: Core V2 Features (Windows)
1. ✅ Create v2-dev branch
2. ⏳ Add bundled resources structure
3. ⏳ Implement offline installation logic
4. ⏳ Move language selection to welcome screen
5. ⏳ Enhance dependency detection

### Phase 2: Advanced Management
1. ⏳ Build model switching UI
2. ⏳ Add parameter editor with presets
3. ⏳ Implement auto-troubleshooting system
4. ⏳ Add health check dashboard

### Phase 3: macOS Port
1. ⏳ Create v2-macos branch
2. ⏳ Port Rust commands to macOS
3. ⏳ Update UI for macOS conventions
4. ⏳ Add macOS CI/CD workflow
5. ⏳ Test on Intel + Apple Silicon

### Phase 4: Testing & Release
1. ⏳ Integration testing (Windows + macOS)
2. ⏳ User acceptance testing with non-technical users
3. ⏳ Documentation updates
4. ⏳ Release v2.0.0 (Windows + macOS)

## Technical Debt & Risks

### Risks
1. **Installer Size**: 200-300MB may be too large for some users
   - Mitigation: Offer both lite (v1) and full (v2) versions
2. **Bundled Resources Outdated**: OpenClaw updates frequently
   - Mitigation: Auto-update mechanism to fetch latest after installation
3. **macOS Notarization**: Requires Apple Developer account ($99/year)
   - Mitigation: Provide unsigned .app for testing, signed for release

### Technical Debt
1. Hardcoded paths in v1 need refactoring for cross-platform
2. Error handling needs improvement (too many unwrap())
3. Test coverage is low (no unit tests yet)

## Success Metrics

- ✅ Installer works without internet connection
- ✅ Non-technical users can install without help
- ✅ Auto-troubleshooting resolves 80%+ common issues
- ✅ macOS version has feature parity with Windows
- ✅ Installer size < 300MB
