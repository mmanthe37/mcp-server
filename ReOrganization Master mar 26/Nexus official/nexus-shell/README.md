# NexusShell

> Secure, AI-powered cross-platform terminal emulator for iOS and Android.

NexusShell is the winner of 90+ design competition rounds — a production-grade mobile terminal app built with React Native + Expo, featuring the NexusFlow Protocol (Mosh-inspired delta encoding), on-device AI intelligence, zero-trust security, and rich interactive UI.

## Features

- **NexusFlow Protocol** — Mosh-inspired with delta encoding, LZ4 compression, speculative echo, and reconnect resilience
- **AI Intelligence** — On-device TF Lite inference for predictive commands, NL-to-shell translation, and error diagnosis
- **Zero-Trust Security** — Platform keystore integration, mTLS certificates, biometric authentication, device pairing
- **Rich Terminal UI** — GPU-accelerated rendering, smart paste, contextual input bar, haptic feedback
- **Session Management** — Persistent tmux-backed sessions with seamless reconnect
- **Policy Engine** — Command risk classification with user confirmation gates
- **Cross-Platform** — Single codebase for iOS and Android via React Native + Expo

## Architecture

```
nexus-shell/
├── apps/mobile/       # React Native + Expo app (iOS & Android)
├── packages/          # Shared TypeScript packages
│   ├── shared-types/          # API contracts and type definitions
│   ├── nexusflow-protocol/    # NexusFlow Protocol implementation
│   ├── terminal-parser/       # ANSI/VT escape sequence parser
│   ├── ai-models/             # ML model definitions & inference
│   ├── policy-engine/         # Command risk classification
│   └── ui-kit/                # Design system components
├── server/            # Fastify backend with WebSocket
├── docs/              # Architecture documentation
└── .github/           # CI/CD workflows
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

## Quick Start

### Prerequisites
- Node.js >= 18
- npm >= 9
- PostgreSQL 16+
- Expo CLI (`npx expo`)
- EAS CLI (`npm install -g eas-cli`) — for device builds
- iOS Simulator (macOS) / Xcode 15+ or Android Emulator

### Environment Variables

Create `server/.env`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/nexus
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
PORT=3000
NODE_ENV=development
```

### Setup
```bash
cd nexus-shell
npm install
npx prisma generate --schema=server/prisma/schema.prisma
npx prisma migrate dev --schema=server/prisma/schema.prisma
```

### Development
```bash
# Start the backend server
cd server && npm run dev

# Start the mobile app
cd apps/mobile && npx expo start
```

### Testing
```bash
npm test                 # Run all tests
npm run test:ci          # CI mode with coverage
```

### Building for Production
```bash
# iOS
cd apps/mobile && eas build --platform ios --profile production

# Android
cd apps/mobile && eas build --platform android --profile production
```

## Packages

| Package | Description |
|---------|-------------|
| **shared-types** | TypeScript interfaces for User, Device, Session, Policy, Audit, NexusFlow frames |
| **nexusflow-protocol** | Delta encoding, LZ4 compression, speculative echo, connection management |
| **terminal-parser** | State-machine ANSI parser with scrollback buffer |
| **policy-engine** | Regex-based command risk classification (blocked/dangerous/elevated/safe) |
| **ai-models** | TensorFlow Lite engine stubs for command prediction, NL→shell, error diagnosis |
| **ui-kit** | Colors (dark/light), spacing scale, typography, shadows, ANSI color map |

## Development

```bash
# Type-check all packages
npm run typecheck --workspaces --if-present

# Lint
npm run lint --workspaces --if-present

# Run tests
npm test --workspaces --if-present

# Build server
npm run build --workspace=server

# iOS simulator
npm run ios --workspace=apps/mobile

# Android emulator
npm run android --workspace=apps/mobile
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Framework | React Native + Expo |
| Navigation | Expo Router (file-based) |
| State Management | Zustand |
| Backend | Fastify + WebSocket |
| Database | PostgreSQL + Prisma |
| Protocol | NexusFlow (WebSocket + QUIC upgrade path) |
| AI/ML | TensorFlow Lite (cross-platform) |
| Security | Zero-trust PKI, mTLS, Secure Enclave |
| CI/CD | GitHub Actions + EAS Build |

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [NexusFlow Protocol](packages/nexusflow-protocol/README.md)

## License

MIT
