# Bundled Resources for Offline Installation

This directory contains pre-downloaded resources for offline installation.

## Directory Structure

```
resources/
├── openclaw/           # OpenClaw source code
├── installers/         # Dependency installers
├── npm-cache/          # Pre-downloaded npm packages
├── mirrors.json        # Mirror URLs for China users
└── README.md           # This file
```

## How to Prepare Resources

### 1. Download OpenClaw Latest Release

```bash
# Get latest release from GitHub
cd openclaw/
curl -L https://github.com/openclaw/openclaw/archive/refs/tags/v1.2.3.tar.gz -o openclaw-v1.2.3.tar.gz
```

### 2. Download Node.js Installers

```bash
cd installers/

# Windows x64
curl -L https://nodejs.org/dist/v22.12.0/node-v22.12.0-x64.msi -o node-v22.12.0-win-x64.msi

# macOS Intel
curl -L https://nodejs.org/dist/v22.12.0/node-v22.12.0.pkg -o node-v22.12.0-darwin-x64.pkg

# macOS Apple Silicon
curl -L https://nodejs.org/dist/v22.12.0/node-v22.12.0-arm64.pkg -o node-v22.12.0-darwin-arm64.pkg
```

### 3. Download Docker Desktop (Windows only)

```bash
cd installers/
curl -L https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe -o DockerDesktop-win.exe
```

### 4. Pre-cache npm Dependencies

```bash
cd npm-cache/

# Install openclaw to get all dependencies
npm pack openclaw --pack-destination .

# Or manually download dependencies
npm pack @anthropic-ai/sdk axios dotenv express ...
```

## Build Configuration

Update `tauri.conf.json` to include these resources:

```json
{
  "bundle": {
    "resources": [
      "resources/**/*"
    ]
  }
}
```

## Size Estimates

- OpenClaw source: ~5MB
- Node.js installers: ~50MB each (Windows + macOS x2 = 150MB)
- Docker Desktop: ~500MB (optional, not bundled by default)
- npm cache: ~20MB
- **Total: ~175MB** (without Docker)

## Notes

- Resources are optional - installer will fallback to online download if missing
- Docker Desktop is NOT bundled due to size (500MB+)
- Update `mirrors.json` to add more mirror URLs for China users
