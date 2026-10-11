# CSCI 300 · OS Learning Lab

An interactive learning platform for **Amity University Dubai**, covering Weeks 2, 3 and 4. No backend, account, paid API, external fonts or production dependencies.

## Open the website

**Simplest:** double-click `dist/index.html`. All learning content and interactions work without a server or internet connection. Local-file progress storage depends on the browser; use the local server for a consistent origin.

**Recommended:** open a terminal in this folder and run:

```powershell
node scripts/serve.cjs
```

Then open **http://127.0.0.1:5173**. Stop the server with Ctrl+C. If port 5173 is occupied, close the previous server or set a different `PORT` environment variable.

## What is included

- All 19 requested major sections, all named subsections, exact CLO statements and weekly introductions.
- Weekly overview, section navigation, Previous/Next controls, explicit completion tracking and animated complete journeys.
- Application/OS/hardware exploration; file-request and compiler/linker/loader journeys; CPU queue; shared-memory and message communication; client–server flow; thread/core activities; model diagrams; shared-data update demonstration.
- A knowledge check for every major lesson and classification activities where requested.
- Three separate quizzes, each with 5 easy, 5 medium and 5 difficult MCQs, A–D choices, submission-based feedback, scoring, final answer review and randomized restart.
- A separate exam workspace per week, each with 4 short questions, 2 long questions and 5 MCQs. Model answers start hidden.
- A connected Big Picture page, responsive layouts, keyboard-operable controls and reduced-motion styling.

Quiz attempts stay in memory while navigating this open page; refreshing starts a fresh attempt. Completion progress stays in browser `localStorage` when available. Marking a lesson complete is a student action, not a claim of assessed mastery. Finishing a quiz marks that quiz step complete regardless of score. No student data is transmitted.

## Edit the course

| File | Purpose |
| --- | --- |
| `dist/content.js` | CLOs, lessons, definitions, examples, diagram stages, activities and lesson checks |
| `dist/questions.js` | 45 quiz questions plus exam question/model-answer content |
| `dist/app.js` | Reusable navigation, diagrams, interactions, quiz engine and progress rendering |
| `dist/styles.css` | Theme, concept colours, responsive layouts and animation |
| `dist/index.html` | Page shell, metadata and favicon |

Question `answer` values are zero-based: `0` = A, `1` = B, `2` = C, `3` = D. The weekly quiz order is shuffled independently from the source question order. Exam MCQs reference question indices in their week’s bank. Educational content is trusted source code, not user-submitted HTML.

The four-layer OS diagram is a conceptual responsibility map. The program journey describes a compiled C example. Browser diagrams simplify real multi-process architectures. Scheduling remains conceptual, and advanced synchronization is intentionally deferred.

## Verify

No installation is needed for the content/syntax checks:

```powershell
node scripts/check.cjs
```

Run the dependency-free application-state tests:

```powershell
node scripts/test.cjs
```

These checks use a minimal document adapter to exercise route rendering, quiz submissions, scoring, resets and learning state. They do not run a browser or assess visual layout. For a final teaching review, inspect desktop, tablet and phone widths, keyboard navigation and 200% zoom in your chosen browser.

## Publish later with GitHub Pages

The ready-to-publish website is the **contents of `dist/`**. It uses relative asset links and hash navigation, so it works at a GitHub project subpath without server rewrite rules.

1. Put the files inside `dist/` at the root of a GitHub Pages publishing branch, including `index.html`, the CSS and all three JavaScript files. Alternatively, copy those contents into a `docs/` publishing folder in your repository.
2. Configure the repository’s GitHub Pages publishing source to use that branch and folder.
3. Visit the Pages URL provided by GitHub. The three weeks, quizzes and navigation work as static files.

No compilation or deployment secrets are needed. The repository has not been created or published automatically.

## Browser agent enhancement

In browsers that implement `document.modelContext.registerTool`, the page optionally exposes `navigate_learning_section`. It validates a week and section and uses the same rendering path as the visible interface; it never marks learning complete. Unsupported browsers simply use the normal interface.
