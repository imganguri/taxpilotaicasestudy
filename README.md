# TaxPilot AI — AI Engineer Case Study Prototype

TaxPilot AI is a working, clickable frontend prototype for a greenfield client and CPA tax platform. It intentionally uses hardcoded data and simulated AI outputs so the submission focuses on the evaluated areas: visual design, interaction design, information architecture, traceability, collaboration, status clarity, prioritization, role-aware experiences, and trustworthy AI.

## What is included

The prototype covers all ten challenges in the case study:

1. **Source Document Traceability** — Select a return field and see the extracted value, source document, exact page/section, highlighted source region, transformation formula, confidence, recommended action, and audit history.
2. **Client & CPA Collaboration** — Contextual threads are linked to documents and tax issues. Client-visible messages and internal notes are visibly distinct. Each open thread shows the owner and due date of the next action.
3. **Where to Start** — The client workspace opens with one dominant next action and a short checklist. Technical tax detail stays hidden until relevant.
4. **Getting Lost Between Parts of the App** — Persistent global navigation, breadcrumbs, linked context strips, deep-linkable URL hashes, back-to-filtered-list behavior, and contextual jumps preserve orientation.
5. **Role-Aware Experiences** — The workspace switcher demonstrates Preparer, Reviewer, and Client contexts in one shell. Navigation, metrics, language, permissions, and visible detail adapt by role.
6. **Return Status & Progress** — A shared five-stage model explains the current stage, completed work, next step, next owner, and blocker. Client and staff see the same model with different detail depth.
7. **An Actionable Dashboard** — A queue is ranked by filing deadline, blocker severity, client wait time, risk, and stage. Users can filter to priority, owned/reviewable work, or blocked work and move directly into action.
8. **Clickable vs. Editable** — A UI states page and repeated patterns across the app distinguish clickable, editable, AI-generated, verified, approval-required, and locked states using labels, icons, borders, and surface treatment—not color alone.
9. **Complexity Made Navigable** — The evidence library contains 240 generated mock documents with search, filtering, pagination, summary/detail views, and persistent context.
10. **Trustworthy AI** — AI recommendations show the recommendation, plain-language reason, evidence, confidence, uncertainty, suggested action, correction workflow, and retained audit history.

## What is real versus simulated

### Wired and interactive

- Role switching between Preparer, Reviewer, and Client
- Navigation, URL hash deep links, breadcrumbs, and contextual jumps
- Return-field selection and source trace display
- Verification and correction flows with in-session audit history
- Dashboard sorting/filtering behavior
- Document search, status filtering, pagination, and detail views
- Collaboration thread selection, client/internal visibility, message creation, issue resolution, and action ownership
- Client checklist progression
- Responsive layout for desktop, tablet, and mobile
- Keyboard quick-jump dialog with `Ctrl/Cmd + K`

### Simulated

- OCR and document parsing
- AI extraction, confidence scoring, recommendations, and warnings
- Authentication and authorization enforcement
- File uploads and PDF rendering
- Messaging backend and notifications
- Tax calculations and tax-law validation
- Persistence beyond the current browser session, except the selected role

The simulated behavior is intentional. The case study asks for a frontend-focused proof of concept and explicitly permits hardcoded data and mocked AI responses.

## Run locally

No build process or package installation is required.

1. Download or clone the folder.
2. Open `index.html` directly in a modern browser.

For a local web server, run one of the following in the project folder:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.


## Design principles

- **Evidence before authority:** AI output never appears as unquestionable truth.
- **One next action:** Each workspace makes the next owner and next action explicit.
- **Shared model, different depth:** Clients and professionals use the same core objects and stages, with role-appropriate detail.
- **Context travels with the user:** Documents, messages, tasks, and return fields remain connected as users navigate.
- **Progressive disclosure:** High-volume and technical information is available without dominating the default view.
- **Correction without destruction:** Human corrections preserve original AI output and evidence for defensibility.

## Accessibility and UX details

- Semantic buttons, labels, dialogs, tables, and navigation landmarks
- Visible keyboard focus states
- Text and icon labels supplement color-coded states
- Responsive navigation and layouts
- Plain-language client copy
- Reduced reliance on hover-only interactions
