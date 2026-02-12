# `/digital-dna` Deployment Smoke Runbook

## Purpose
Use this runbook before promoting any release to production that touches:
- `src/app/digital-dna/page.tsx`
- `src/components/DigitalDNAHub.tsx`
- audio, canvas, or interaction logic used by `/digital-dna`

## Owners
- **Primary owner (Feature):** Frontend engineer on-call for the release window.
- **Secondary owner (QA):** Release QA reviewer validating smoke evidence.
- **Approver:** Engineering manager or release captain.

> Owner assignment is required per release. Record names and timestamp in the release ticket before promotion.

## Preconditions
1. Candidate build is deployed to staging (or pre-prod) with production-like settings.
2. CI quality gate has passed (`npm run lint`, `npm run build`).
3. Browser and device targets are available:
   - Desktop Chromium (latest)
   - iOS Safari (or simulator)
   - Android Chrome (or emulator)

## Smoke Checklist for `/digital-dna`

### 1) Route loads without SSR crash
- Navigate directly to `/digital-dna` (hard refresh and direct URL entry).
- Confirm page renders and no server-side runtime error/500 is observed.
- Confirm browser console has no fatal hydration/SSR mismatch errors.

**Pass criteria:** Route is reachable and interactive on first load without crash.

### 2) Mode switching works across all 5 modes
- From `/digital-dna`, switch through all five available UI modes.
- Verify each mode updates visual state and control panel labels.
- Return to the first mode to verify state can cycle end-to-end.

**Pass criteria:** All 5 modes can be entered and exited without UI lockup.

### 3) Audio init requires user interaction + sequence playback works
- On first page load, confirm audio does **not** auto-play before user gesture.
- Perform a user gesture (click/tap the intended audio-start control).
- Trigger a sequence and verify audible playback starts and proceeds.
- Toggle pause/resume (if provided) and verify expected behavior.

**Pass criteria:** Audio context starts only after user interaction and sequence playback completes successfully.

### 4) Canvas interactions function
Validate the three key interactions:
1. **Hover note trigger** responds when pointer is moved over interactive note regions.
2. **Mandala paint** draws/updates visuals from drag or pointer input.
3. **Particle follow** tracks pointer movement smoothly.

**Pass criteria:** All three interactions respond in real time without freezing or major artifacting.

### 5) Mobile viewport sanity + performance baseline
- Validate on a narrow viewport (e.g., 390x844).
- Ensure controls remain visible and reachable with no blocking overlap.
- Interact continuously for 60 seconds and confirm no severe frame collapse/stutter.
- Capture basic telemetry (DevTools perf/FPS readout if available).

**Baseline target:**
- No critical layout breakage.
- No persistent input lag.
- No runaway CPU/memory behavior during 60s interaction.

## Evidence to Attach
- Short screen capture (desktop) showing:
  - route load
  - all 5 mode switches
  - audio gesture + sequence playback
  - canvas interactions
- Mobile screenshot/video for viewport sanity.
- Link CI run proving lint/build gate passed.

## Promotion Gate (Required)
Before production promotion, release owner must mark all below as complete:
- [ ] `npm run lint` passed in CI.
- [ ] `npm run build` passed in CI.
- [ ] `/digital-dna` smoke checklist completed with evidence attached.
- [ ] Smoke owner recorded in release ticket.

## Rollback Criteria
Rollback immediately (or halt promotion) if any of the following occurs:
1. `/digital-dna` returns 5xx or blank screen after deployment.
2. Any of the 5 modes fails to render or traps navigation.
3. Audio starts without gesture or cannot start after gesture.
4. Canvas interaction regressions block hover, paint, or particle follow behavior.
5. Mobile viewport has blocking layout breakage or sustained severe interaction lag.

## Rollback Procedure
1. Stop traffic ramp / halt promotion.
2. Revert to the previous known-good deployment.
3. Confirm `/digital-dna` route health and core interactions on rollback build.
4. Open incident note with root-cause owner and remediation ETA.
