# marp_skill

## Purpose

Operational procedure for an agent to produce a complete, valid Marp Markdown slide deck from a topic or brief, then export it via Marp CLI. This is not documentation about Marp — it is a strict recipe for generating presentation files.

## Use when

- User asks to create a presentation, slide deck, or pitch deck.
- User asks for slides on a specific topic.
- User provides content and requests Marp or slide output.
- Task requires converting existing content (doc, plan, report) into presentation format.
- Output format requested is `.md` (Marp), `.html`, `.pdf`, or `.pptx` slides.

## Do not use when

- User wants a written document, report, or README (use standard Markdown).
- User asks for a Marp tutorial or explanation of Marp syntax.
- User wants to edit an existing non-Marp presentation (PowerPoint, Google Slides).
- Content requires complex animations, embedded video, or interactive elements beyond Marp capabilities.
- User explicitly requests a different presentation tool (reveal.js, Slidev, etc.).

## Expected inputs

| Input | Required | Description |
|-------|----------|-------------|
| Topic or brief | ✅ | Subject matter, goals, audience |
| Key points | Optional | Specific items to cover |
| Slide count | Optional | Target number of slides (default: 8–15) |
| Theme | Optional | `default`, `gaia`, `uncover`, or custom CSS path |
| Export format | Optional | `html` (default), `pdf`, `pptx`, `png` |
| Aspect ratio | Optional | `16:9` (default) or `4:3` |
| Language | Optional | Content language (default: match user language) |

## Workflow

```
1. ANALYZE  → Extract topic, audience, goal, scope from user input
2. OUTLINE  → Build slide-by-slide outline (title + 1 sentence each)
3. DRAFT    → Write full Marp Markdown following all rules below
4. VALIDATE → Check against quality checklist
5. WRITE    → Save .md file to disk
6. EXPORT   → Run Marp CLI to produce requested output format
7. DELIVER  → Return file path(s) to user
```

### Step details

**1. ANALYZE** — Determine:
- Who is the audience? (executives, engineers, general)
- What is the goal? (inform, persuade, report, teach)
- What is the scope? (broad overview vs. deep dive)
- What tone? (formal, casual, technical)

**2. OUTLINE** — Create a narrative arc:
- Opening: hook or context-setting slide
- Body: one idea per slide, logical progression
- Closing: summary, call to action, or next steps

**3. DRAFT** — Apply all structure, writing, and design rules below.

**4. VALIDATE** — Run the final quality checklist. Fix any failures.

**5. WRITE** — Save the `.md` file. Filename: kebab-case matching topic (e.g., `q3-sales-review.md`).

**6. EXPORT** — Execute Marp CLI:
```bash
# HTML (default)
npx @marp-team/marp-cli@latest slides.md -o slides.html

# PDF
npx @marp-team/marp-cli@latest slides.md -o slides.pdf --allow-local-files

# PPTX
npx @marp-team/marp-cli@latest slides.md -o slides.pptx --allow-local-files

# PNG (all pages)
npx @marp-team/marp-cli@latest slides.md --images png --allow-local-files
```
Use `--allow-local-files` only when the deck references local images.

**7. DELIVER** — Report exported file path(s) and slide count.

## Presentation structure rules

| Rule | Detail |
|------|--------|
| **One idea per slide** | Never combine two distinct concepts on one slide |
| **Slide count** | 8–15 slides for a standard deck; adjust to content |
| **Title slide** | First slide: deck title, subtitle, author/date |
| **Agenda slide** | Optional; include if ≥10 slides |
| **Section dividers** | Use a styled divider slide before each major section (≥3 sections) |
| **Closing slide** | Last slide: summary, call to action, or "Thank you" with contact |
| **Slide titles** | Every slide MUST have an `# H1` or `## H2` title; never leave a slide untitled |
| **Title specificity** | Titles must be specific assertions, not generic labels. "Revenue grew 23% in Q3" not "Revenue" |
| **Horizontal rule = new slide** | Use `---` to separate slides (Marp convention) |
| **Presenter notes** | Add `<!-- speaker notes here -->` below slide content when useful context exists |

## Slide writing rules

| Rule | Detail |
|------|--------|
| **Max 6 lines of body text per slide** | Exclude title and speaker notes |
| **Max 8 words per bullet** | Trim ruthlessly |
| **No paragraphs** | Use bullet lists, not prose |
| **No sub-sub-bullets** | Max nesting depth: 2 levels |
| **Numbers > adjectives** | "Grew 23%" not "Grew significantly" |
| **Active voice** | "Team shipped v2" not "v2 was shipped by the team" |
| **Parallel structure** | All bullets in a list follow the same grammatical form |
| **No filler slides** | Every slide must earn its place; cut "Overview" or "Introduction" slides that say nothing |
| **Code blocks** | Use fenced blocks with language tag; max 10 lines per slide |

## Editorial design rules

| Rule | Detail |
|------|--------|
| **Theme** | Set via `theme:` directive in front matter; default to `default` |
| **Aspect ratio** | Set via `size:` directive; default `16:9` |
| **Background images** | Use `![bg](url)` syntax; use `![bg right:40%](url)` for split layouts |
| **Background color** | Use `<!-- _backgroundColor: #hex -->` local directive |
| **Text color** | Use `<!-- _color: #hex -->` local directive |
| **Scoped styles** | Use `<style scoped>` inside a slide for one-off styling |
| **Global styles** | Use `<style>` in first slide or front matter `style:` directive |
| **Emphasis** | Bold (`**key term**`) for important words; use sparingly (≤3 per slide) |
| **Images** | Always include alt text; size with `w:` and `h:` keywords (e.g., `![w:300](img.png)`) |
| **Consistent palette** | Pick 2–3 accent colors; use them throughout |
| **Whitespace** | Prefer fewer elements with breathing room over dense slides |
| **Fragmented lists** | Use `*` marker (not `-`) if you want items to appear one-by-one in bespoke template |

## Default Marp template

Use this as the starting skeleton for every new deck. Adapt content; keep structure.

````markdown
---
marp: true
theme: default
size: 16:9
paginate: true
header: ''
footer: ''
style: |
  section {
    font-family: 'Segoe UI', system-ui, sans-serif;
  }
  section.lead h1 {
    font-size: 2.5em;
    text-align: center;
  }
  section.lead p {
    text-align: center;
    color: #666;
  }
---

<!-- _class: lead -->
<!-- _paginate: skip -->

# Deck Title

Subtitle or tagline

**Author** — Date

---

## Agenda

1. First section
2. Second section
3. Third section

---

<!-- _class: lead -->
<!-- _backgroundColor: #0078d4 -->
<!-- _color: #fff -->

# Section One

---

## Specific assertion as title

- Concise point one
- Concise point two
- Concise point three

<!-- Speaker notes: expand on context here -->

---

## Data-driven slide title

| Metric | Q2 | Q3 | Δ |
|--------|----|----|---|
| Revenue | $2.1M | $2.6M | +23% |
| Users | 12K | 18K | +50% |

---

## Visual split layout

![bg right:40%](https://via.placeholder.com/800x600)

- Key point about the image
- Supporting detail
- Call to action

---

<!-- _class: lead -->
<!-- _backgroundColor: #0078d4 -->
<!-- _color: #fff -->

# Summary & Next Steps

---

## Key takeaways

1. **First takeaway** — one sentence
2. **Second takeaway** — one sentence
3. **Third takeaway** — one sentence

**Next step:** Specific action with owner and deadline

---

<!-- _class: lead -->
<!-- _paginate: skip -->

# Thank You

Questions? → email@example.com
````

## Common failure modes

| Failure | Symptom | Fix |
|---------|---------|-----|
| Missing `marp: true` | Renders as plain Markdown, not slides | Add `marp: true` to front matter |
| No `---` separators | Entire deck is one giant slide | Add `---` between every slide |
| Walls of text | Audience reads instead of listens | Cut to ≤6 lines, ≤8 words per bullet |
| Generic titles | "Overview", "Details", "Results" | Rewrite as specific assertions |
| Broken images in PDF/PPTX | Images missing after export | Add `--allow-local-files` flag; or use absolute URLs |
| Wrong aspect ratio | Content cropped or letterboxed | Set `size: 16:9` or `size: 4:3` in front matter |
| Theme not applied | Slides render with no styling | Verify `theme:` value matches an available theme (`default`, `gaia`, `uncover`) |
| Code blocks overflow | Long code runs off-slide | Limit to 10 lines; reduce font with `<style scoped>pre { font-size: 0.7em; }</style>` |
| PPTX not editable | Images are baked as backgrounds | Use `--pptx-editable` flag (experimental; requires LibreOffice) |
| Pagination on title slide | Page number "1" on cover | Add `<!-- _paginate: skip -->` to title slide |

## Final quality checklist

Run before delivering. Every item must pass.

```
[ ] Front matter contains `marp: true`
[ ] `theme:` and `size:` are set
[ ] Every slide has a title (H1 or H2)
[ ] No slide exceeds 6 lines of body text
[ ] No bullet exceeds ~8 words
[ ] One idea per slide — no concept mixing
[ ] Titles are specific assertions, not generic labels
[ ] Narrative flows logically from slide 1 to last
[ ] Title slide has: title, subtitle, author, date
[ ] Closing slide has: summary or call to action
[ ] All images have alt text
[ ] Presenter notes added where context is needed
[ ] No orphan slides (every slide connects to the story)
[ ] `---` separator between every slide
[ ] Marp CLI export succeeds without errors
[ ] Exported file opens correctly in target application
```

## Output format

| Artifact | Path | Description |
|----------|------|-------------|
| Marp Markdown source | `<name>.md` | The primary deliverable; valid Marp deck |
| Exported file | `<name>.html` / `.pdf` / `.pptx` | Rendered output via Marp CLI |

Always deliver the `.md` source file. Export to additional format only when requested or when the user's context implies they need a shareable file (PDF for email, PPTX for PowerPoint, HTML for web).
