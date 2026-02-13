# Meta-Pet Threat Model

## Scope
This threat model covers the browser-hosted Meta-Pet web app and its local/offline data flows.

## Assets
- Raw DNA input and derived local profile data
- PrimeTail identity payloads and signature material
- Sealed export/import payloads
- Addon signatures and verification metadata
- Local persistence state (IndexedDB/local browser storage)

## Adversaries
- Curious local user with device access
- Malicious user attempting payload tampering before import/share
- Opportunistic attacker reading publicly shared payloads
- Accidental misuse (shared classrooms/devices without reset)

## Trust boundaries
- **Trusted**: in-browser runtime, local cryptographic operations, app-controlled validation checks
- **Partially trusted**: local storage durability and privacy characteristics
- **Untrusted**: external transports, copied payloads, manually edited exports, QR payload receivers

## In-scope attacks
- Tampering with exported payload structure
- Tampering with signed identity metadata
- Replay of stale/shareable payloads
- Data exposure through weak operational practices on shared devices

## Out-of-scope attacks
- Host OS compromise or malware on user device
- Browser engine vulnerabilities
- Strong confidentiality guarantees for all metadata shared by user choice
- Post-quantum security guarantees (no PQC implementation is claimed)

## Security claims and implementation anchors
- Tamper-evident identity claims are anchored in HMAC checks in `src/lib/identity/crest.ts`.
- Sealed export integrity checks are anchored in `src/lib/persistence/sealed.ts`.
- Addon authenticity checks are anchored in ECDSA P-256 verification in `src/lib/addons/crypto.ts`.

## Operational guidance
- Do not describe this system as "quantum-resistant" unless standards-based PQC is implemented.
- Prefer "tamper-evident" over "tamper-proof".
- For classroom/shared devices, provide and use explicit data reset workflows between users.
