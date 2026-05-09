# Symmetry Art Studio Next-Step Implementation Plan

Date: 2026-05-09
Branch: `codex/next-step-all`
Method: `superpowers:subagent-driven-development`

## Goal

Implement all five recommended next steps for Symmetry Art Studio:

1. Refresh the Hong's Vibe Coding Lab archive card.
2. Add a classroom lesson package.
3. Add symmetry exploration v0.2 features.
4. Improve artwork save/share UX.
5. Harden tablet classroom use.

## Context

The app is already published at:

- App: `https://wbmaker2.github.io/symmetry-art-studio/`
- Repository: `https://github.com/WBmaker2/symmetry-art-studio`

The current app already supports reflected free drawing, axis switching, color/brush controls, eraser, undo/redo, two-step clear, mission tracking, CI, E2E, and Pages asset verification.

## Task 1: Prepare and Apply Hong's Vibe Coding Lab Refresh

### Implementation

- Prepare current archive metadata grounded in the app's visible UI and documentation:
  - title
  - one-sentence Korean summary
  - app URL
  - GitHub URL
  - 3-5 Korean tags
  - subject
  - grade
  - public memo
- Capture a fresh first-screen screenshot from the final deployed app.
- Update the existing HVC entry rather than creating a duplicate when the URL/title/GitHub URL match.
- Verify admin and public archive cards after save.

### Acceptance Criteria

- No admin password is written into repository files.
- Thumbnail is a real screenshot, not placeholder.
- Public HVC card opens the live app URL.
- Final report includes whether the card was created or updated and the visible metadata.

## Task 2: Add Classroom Lesson Package

### Implementation

- Add a classroom package document under `docs/classroom/`.
- Include:
  - 15-minute introduction activity
  - 40-minute main lesson flow
  - student mission card
  - teacher observation checklist
  - formative assessment prompts
  - extension ideas for math/art integration
- Link the package from `README.md`.

### Acceptance Criteria

- The document is Korean, teacher-facing, and directly tied to grades 5-6 math/art.
- It references `[6수03-03]` and `[6미02-02]`.
- It does not describe the app as a marketing landing page.

## Task 3: Add Symmetry Exploration v0.2 Features

### Implementation

- Add a visible grid toggle that also affects saved artwork output.
- Add a point exploration mode:
  - tapping/clicking the canvas places an original point and its reflected point.
  - both points are labeled clearly.
  - point actions participate in undo/redo and clear.
- Add a distance hint toggle:
  - when enabled for point mode, show the symmetry-axis foot and equal-distance guide.
  - show a concise observation message after a point is placed.
- Keep brush and eraser behavior unchanged.

### Acceptance Criteria

- Unit tests cover point reflection and guide calculations.
- App tests cover toggling grid/distance hints and point mode creation.
- Existing draw/undo/redo/clear behavior stays covered.
- Canvas remains keyboard/assistive-tech understandable through status text.

## Task 4: Improve Artwork Save and Share UX

### Implementation

- Change PNG export into an artwork card export:
  - includes the drawing canvas
  - includes date
  - includes selected symmetry axis
  - includes a short classroom title/footer
- Use a descriptive filename with date and axis.
- Add a share-copy button that creates a short Korean share sentence for classroom display or LMS posting.
- Provide clipboard fallback status when clipboard access is unavailable.

### Acceptance Criteria

- Tests verify export filename/data URL behavior without requiring a real browser download.
- Tests verify share text creation and fallback status.
- Save/share status messages are exposed through the existing live status.

## Task 5: Harden Tablet Classroom Use

### Implementation

- Make touch targets consistently classroom-tablet friendly.
- Prevent accidental page scrolling while drawing.
- Add a tablet Playwright project or equivalent tablet smoke coverage.
- Add responsive checks for no horizontal overflow and visible canvas controls.
- Keep desktop and mobile E2E coverage.

### Acceptance Criteria

- `npm run e2e` covers desktop, tablet, and mobile.
- Tablet smoke verifies pen/touch drawing still produces reflected pixels.
- Layout avoids horizontal overflow at tablet and mobile widths.
- Touch controls remain at least 44px high where practical.

## Final Verification

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run e2e`
- `npm run verify:pages` after deployment
- GitHub Pages workflow success with live asset verification
- HVC admin/public card verification

