# NexusShell — Architecture Guide

## Overview

NexusShell is a cross-platform (iOS, Android) terminal application that provides secure, AI-powered remote access to macOS machines. It implements the **NexusFlow Protocol** — a Mosh-inspired, delta-encoded streaming protocol — for low-latency terminal interaction over unreliable networks.

## System Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Mobile Client                      │
│  React Native + Expo (iOS / Android)                │
│  ┌────────┐ ┌────────────┐ ┌──────────────────┐    │
│  │ Screens│ │  Stores    │ │ Native Modules   │    │
│  │ (Expo  │ │ (Zustand)  │ │ - GPU Renderer   │    │
│  │ Router)│ │            │ │ - Secure Storage  │    │
│  └───┬────┘ └─────┬──────┘ │ - AI Engine      │    │
│      │            │         └────────┬─────────┘    │
│      └────────────┼─────────────────┘               │
│                   │                                  │
│           ┌───────▼────────┐                        │
│           │  NexusFlow     │                        │
│           │  Protocol      │                        │
│           │  (WebSocket →  │                        │
│           │   QUIC upgrade)│                        │
│           └───────┬────────┘                        │
└───────────────────┼─────────────────────────────────┘
                    │  Binary frames (delta + LZ4)
                    │
┌───────────────────▼─────────────────────────────────┐
│                  Server (Fastify)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ REST API │ │ WebSocket│ │ Service Layer    │    │
│  │ Routes   │ │ Gateway  │ │ - Auth           │    │
│  └────┬─────┘ └────┬─────┘ │ - Session        │    │
│       │             │       │ - Policy         │    │
│       └─────────────┤       │ - Audit          │    │
│                     │       └─────────┬────────┘    │
│              ┌──────▼──────┐          │             │
│              │   Prisma    │◄─────────┘             │
│              │ (PostgreSQL)│                         │
│              └─────────────┘                         │
└─────────────────────────────────────────────────────┘
                    │  PTY Session (SSH / direct)
                    │
┌───────────────────▼─────────────────────────────────┐
│              Target Machine (macOS)                   │
│  ┌──────────────────────────────────────┐            │
│  │         NexusDaemon (launchd)        │            │
│  │  PTY Manager  │  XPC Service  │ HW  │            │
│  └──────────────────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

## Package Architecture

### Monorepo Layout (npm workspaces)

| Package | Purpose |
|---------|---------|
| `packages/shared-types` | TypeScript type contracts shared across all packages |
| `packages/nexusflow-protocol` | Binary frame encoding, delta engine, speculative echo, connection manager |
| `packages/terminal-parser` | ANSI/VT100 escape sequence state-machine parser + scrollback buffer |
| `packages/policy-engine` | Command risk classification (safe/elevated/dangerous/blocked) |
| `packages/ai-models` | TensorFlow Lite inference (command prediction, NL→shell, error diagnosis) |
| `packages/ui-kit` | Design system tokens (colors, spacing, typography, shadows) |
| `server/` | Fastify API, WebSocket gateway, Prisma ORM, service layer |
| `apps/mobile/` | React Native + Expo app with Expo Router navigation |

### Data Flow

1. **User types** → InputBar captures keystroke
2. **Speculative echo** → Immediate local display (< 1ms perceived latency)
3. **NexusFlow frame** → Binary-encoded, delta-compressed, sent over WebSocket
4. **Server gateway** → Routes frame to target session's PTY
5. **PTY output** → Terminal parser processes ANSI sequences
6. **Delta encoding** → Only changed cells transmitted back
7. **Client render** → TerminalView updates via FlatList/GPU renderer

### Security Model (Zero-Trust)

- **Device Identity**: Each device generates a keypair in the platform keystore (Keychain / Android Keystore)
- **Pairing**: QR-code-based device enrollment with server-verified challenge
- **Transport**: mTLS with app-managed PKI (no system CA dependency)
- **Authentication**: JWT tokens with device fingerprint binding + biometric gate
- **Command Policy**: Every command classified by risk tier before execution
- **Audit Trail**: All actions logged with sensitive data redaction

## Key Design Patterns

- **State Machine**: Terminal parser, connection manager, and auth flow all use explicit state machines
- **Plugin Architecture**: Fastify plugins for auth, error handling, rate limiting
- **Store Pattern**: Zustand stores with middleware (persist, devtools) for client state
- **Service Layer**: Server business logic isolated in services, routes are thin controllers
- **Binary Protocol**: Custom frame format with DataView serialization for efficient wire encoding

## Build & Deploy

### Development Builds
- iOS Simulator: `eas build --platform ios --profile development`
- Android Emulator: `eas build --platform android --profile development`

### Preview Builds (Internal Distribution)
- iOS: `eas build --platform ios --profile preview`
- Android: `eas build --platform android --profile preview`

### Production Builds
- iOS: `eas build --platform ios --profile production`
- Android: `eas build --platform android --profile production`

### Store Submission
- iOS: `eas submit --platform ios --profile production`
- Android: `eas submit --platform android --profile production`

### CI/CD
The GitHub Actions workflow at `.github/workflows/ci.yml` runs:
1. Lint (ESLint + Prettier check)
2. TypeScript compilation (all packages + server + mobile)
3. Unit tests (Jest)
4. Build verification

Production deploys are triggered by pushing a version tag (`v*`).
