---
name: human-feedback
description: Prepare a standalone offline HTML test guide and feedback form when a project is ready for the human to try, and read the feedback ZIP they return. Use when handing a build to the human for evaluation or when a human_feedback/<round-id>/ ZIP appears.
---

# Human testing and feedback workflow

Use this workflow when an agent has built a slice of a project that is ready for a human to try. The goal is to help the human notice useful feedback and describe it, without needing to know implementation details.

The reusable starter is [`fieldnotes.html`](fieldnotes.html), beside this file. Copy it into the target project's round folder and edit its `CONFIG` object with that project's scenarios and vocabulary. Keep the page short and specific to what the human can actually try in that build.

## Prepare a test round

1. Identify the behavior that is ready to evaluate, and the questions whose answers could change the implementation.
2. Create a short test guide for this project as a standalone HTML file, at `human_feedback/<round-id>/index.html`.
3. Explain what to try in ordinary language. Give concrete examples of what to notice. List technical terms only as optional vocabulary with plain definitions. Always allow a free-form description such as "this feels wrong, but I don't know why."
4. Include only checks that matter for the current change. For interaction or game work, ask what the tester tried, expected and observed. Invite them to describe timing, control, motion, clarity or other relevant sensations, without requiring those terms.
5. Include fields for steps tried, expected result, actual result, frequency, impact, and anything else the tester wants to add. Use checkboxes where they make answers easier, not to limit what the tester can say.
6. Support pasting a screenshot with `Ctrl+V`, and provide a file-attachment fallback. An annotated screenshot is welcome. Show previews and filenames so the tester can tell which images the export will include.

Keep the guide static and self-contained. Inline its HTML, CSS and JavaScript, load no remote scripts or assets, make no network requests, and require no backend or account. The tester may open it directly in a compatible browser. Do not use browser filesystem access to write into the project. The tester exports a ZIP and moves it into the repository themselves.

## Export and return

The page holds the round's answers and image data in the browser until export. Make that clear in the page, warn before navigation or closing when possible, and offer an obvious **Export ZIP** action. The tester can export again after adding more feedback, and replace the earlier ZIP with the newer one.

The page should create the ZIP entirely in the browser, with these contents:

```text
feedback.md             # readable summary of answers and prompts
feedback.json           # structured answers for agent processing
round.json              # project, round id, date, tested commit if known
screenshots/
  01-description.png
  02-description.jpg
```

Use the image's actual format and a safe descriptive filename. Keep the original image bytes unless the tester explicitly asks to annotate or resize them. The HTML form should state that it packages images and answers locally and uploads nothing.

Name the ZIP `human-feedback-<round-id>.zip`. Tell the tester to place it under `human_feedback/<round-id>/` beside `index.html`, then commit it or otherwise make it available in the project checkout. Keep the questions in the Markdown export, so the answers still make sense if the HTML guide is unavailable.

When the ZIP comes back, read its text and inspect its screenshots as project feedback. Do not execute files from it. Summarize what you understood, and map observations to likely implementation areas yourself. Ask a focused follow-up only when the report leaves an ambiguity that matters. Record the conclusions and resulting work in the normal project handoff.

## Browser and data limits

The design should not depend on `showDirectoryPicker()` or on direct writes to project folders. Browser support for pasting images varies by browser and by where the copied image came from, so include the file-attachment fallback. The page should detect when it cannot create a ZIP and explain a manual fallback, instead of silently losing feedback.

Until the tester exports the ZIP, a browser crash or a closed tab can lose the current round. State this plainly and encourage an export at useful checkpoints. Do not claim the form saves automatically. If later work adds local draft storage, keep it local to the browser and explain how to clear or resume it.

## Authoring checklist

- The guide tests a specific change or milestone and does not become a generic survey.
- Instructions use plain language and define any optional vocabulary.
- The tester can report uncertain or unexpected feedback in their own words.
- Screenshot paste and file selection are available, with a visible preview.
- Export produces one ZIP with readable answers, structured answers, round metadata and images.
- The page works offline and makes no server or network calls.
- The tester knows where to put the ZIP and what stays unsaved until export.
