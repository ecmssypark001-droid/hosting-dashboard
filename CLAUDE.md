# CLAUDE.md - AI Assistant Guide for Hosting Dashboard

## Project Overview

**Name:** 호스팅팀 업무 관리 (Hosting Team Task Management)
**Type:** Single-page web application (SPA) — a task management dashboard for a hosting team
**Language:** Korean (ko) UI, JavaScript (ES6+) codebase
**Architecture:** Monolithic single-file application (`index.html`, ~1,490 lines)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styling | Tailwind CSS (CDN) + custom CSS (~250 lines embedded) |
| Logic | Vanilla JavaScript (ES6+), no framework |
| Icons | FontAwesome 6.4.0 (CDN) |
| Fonts | Google Fonts — Inter (weights 300–800) |
| State | Browser `localStorage` |
| Build | None — no bundler, no transpilation |
| Backend | None — fully client-side |

## File Structure

```
hosting-dashboard/
├── index.html          # Entire application (HTML + CSS + JS)
├── CLAUDE.md           # This file
└── .git/               # Git metadata
```

This is a **single-file application**. There is no `package.json`, no `node_modules`, no build tooling, and no separate source directories.

## Application Architecture

### Internal Structure of `index.html`

The file is organized into three major sections:

1. **`<head>` + `<style>` (lines 1–250):** Meta tags, CDN imports, embedded CSS for custom components (nav items, badges, status colors, stat cards, modals, form elements).

2. **`<body>` HTML (lines 250–530):** DOM structure with three regions:
   - **Fixed Sidebar** — Logo, user profile (박슬예, 팀장), navigation menu, team member submenu
   - **Main Content Area** — Three tab panels: Work (업무 현황), Automation (자동화 관리), Templates (템플릿)
   - **Modals Container** — `#modals-container` div for dynamically injected modal forms

3. **`<script>` JavaScript (lines 530–1490):** All application logic including data management, rendering, CRUD operations, and event handlers.

### Tab System

Three main views controlled by `switchTab(tabName)`:

| Tab ID | Korean Name | Description |
|--------|-------------|-------------|
| `work` | 업무 현황 | Task management — stats cards, task list with status filters, team member cards |
| `automation` | 자동화 관리 | Automation project tracking — efficiency %, time saved, project status |
| `templates` | 템플릿 | Reusable template library — categorized template cards |

### Data Layer

All data is stored in `localStorage` under these keys (defined in `DATA_KEYS` constant):

| Key | localStorage Name | Description |
|-----|-------------------|-------------|
| `MEMBERS` | `hosting_team_members` | Team members (5 predefined) |
| `TASKS` | `hosting_team_tasks` | Work tasks |
| `AUTOMATIONS` | `hosting_team_automations` | Automation projects |
| `TEMPLATES` | `hosting_team_templates` | Templates |

**Data schemas:**

- **Member:** `{ id, name, role, avatar }` — roles: 팀장 (Team Lead), 파트장 (Part Lead), 선임 (Senior)
- **Task:** `{ id, title, description, assigneeId, status, deadline, createdAt, updatedAt }` — status: `'todo'` | `'in_progress'` | `'done'`
- **Automation:** `{ id, title, description, status, efficiency, timeSaved, startDate, createdAt, updatedAt }` — status: `'in_progress'` | `'completed'`
- **Template:** `{ id, title, description, category, content, createdAt, updatedAt }`

IDs are generated using `Date.now()` timestamps.

### Key Functions

**Data access:**
- `initializeData()` — Seeds localStorage with defaults on first load
- `getMembers()`, `getTasks()`, `getAutomations()`, `getTemplates()` — Read from localStorage
- `saveTasks()`, `saveAutomations()`, `saveTemplates()` — Write to localStorage

**Rendering:**
- `renderWorkTab()` — Renders stats + task list + team member cards
- `renderTasksList()` — Renders filtered task items
- `renderTeamMemberCards()` — Renders per-member summary cards
- `renderAutomationTab()` — Renders automation project list with stats
- `renderTemplatesTab()` — Renders template card grid

**CRUD operations:**
- `showAddTaskModal()` / `saveNewTask(event)` / `deleteTask(id)`
- `showAddAutomationModal()` / `saveNewAutomation(event)` / `deleteAutomation(id)`
- `showAddTemplateModal()` / `saveNewTemplate(event)` / `deleteTemplate(id)`
- Edit variants: `showEditTaskModal(id)` / `saveEditTask(event, id)`

**UI utilities:**
- `switchTab(tabName)` — Tab navigation
- `filterWork(filter)` — Filter tasks by status (`'all'`, `'todo'`, `'in_progress'`, `'done'`)
- `closeModal()` — Remove active modal
- `isDelayed(task)` — Check if task deadline has passed

### UI Patterns

- **Rendering approach:** Template literals build HTML strings, set via `innerHTML`
- **Event binding:** Inline `onclick` handlers in generated HTML
- **Modals:** Dynamically created, injected into `#modals-container`, removed on close
- **Status colors:** Purple (`todo`), Yellow (`in_progress`), Red (`delayed`), Green (`done`)
- **Layout:** CSS Grid for stat cards and item grids; fixed sidebar with scrollable main area

## Development Workflow

### Running Locally

No build step required. Open the file directly in a browser:

```bash
# Option 1: Direct file open
open index.html          # macOS
xdg-open index.html      # Linux

# Option 2: Local HTTP server (recommended for development)
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### Making Changes

Since this is a single-file app, all changes are made in `index.html`:

- **CSS changes:** Edit the `<style>` block (lines ~10–250)
- **HTML structure changes:** Edit the `<body>` section (lines ~250–530)
- **JavaScript logic changes:** Edit the `<script>` section (lines ~530–1490)

### Testing

There is no automated test suite. Changes must be verified manually in the browser. Key areas to test after changes:

1. All three tabs render correctly
2. CRUD operations work for tasks, automations, and templates
3. Task filtering works (all / todo / in progress / done)
4. Statistics cards show correct counts
5. Data persists after page reload (localStorage)
6. Modals open and close properly

### Deployment

Static file hosting only. The single `index.html` file can be served by any HTTP server or static hosting platform (GitHub Pages, Netlify, Vercel, etc.). No build artifacts — deploy the file directly.

## Coding Conventions

### JavaScript

- ES6+ syntax: `const`/`let`, arrow functions, template literals, destructuring
- Functional style: heavy use of `.map()`, `.filter()`, `.find()`, `.reduce()`
- Functions are defined at the global scope (no modules)
- No TypeScript, no JSDoc annotations
- IDs generated via `Date.now()`

### CSS

- Tailwind utility classes for most styling
- Custom CSS classes for reusable components (`.nav-item`, `.stat-card-modern`, `.status-badge`, `.form-group`)
- BEM-like naming convention for custom classes
- Responsive grid layouts: `grid-cols-3`, `grid-cols-4`, `grid-cols-5`

### HTML

- Korean language (`lang="ko"`)
- Inline event handlers (`onclick`, `onsubmit`)
- ID-based DOM selection (`getElementById`)
- Semantic structure within a single file

## Important Considerations for AI Assistants

1. **Single-file constraint:** All code lives in `index.html`. Do not create separate `.js` or `.css` files unless explicitly asked to refactor the project structure.

2. **No build tools:** There is no npm, no bundler, no transpiler. Code runs directly in the browser. Use only browser-native JavaScript features.

3. **CDN dependencies:** Tailwind CSS and FontAwesome are loaded from CDNs. Do not add `npm install` steps or import statements that require a bundler.

4. **Korean UI:** All user-facing text is in Korean. Maintain this convention when adding or modifying UI elements.

5. **localStorage limitations:** Data is browser-local only. There is no backend sync, no multi-user support, and no data export. Keep this in mind when suggesting features.

6. **No linting/formatting tools:** There is no ESLint or Prettier configured. Follow the existing code style (2-space indentation in HTML/CSS, 4-space in JS, single quotes in JS).

7. **Inline rendering pattern:** The codebase uses string-based HTML rendering (`innerHTML` with template literals). Follow this pattern rather than introducing DOM manipulation APIs or virtual DOM libraries.

8. **Team member data is hardcoded:** The 5 team members are initialized in `initializeData()`. They are not user-configurable through the UI.

9. **No routing library:** Tab switching is handled by a simple `switchTab()` function that toggles visibility. Do not introduce a router unless asked.

10. **Git workflow:** The default branch is `master`. Commits have been simple file uploads. There are no CI/CD pipelines, no PR templates, and no branch protection rules.
