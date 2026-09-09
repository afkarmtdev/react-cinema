@AGENTS.md

## Conventions

- Do not use emojis anywhere: code, comments, documentation (README and others),
  commit messages, or in-app text. Keep all wording plain.
- Do not use em dashes. Use commas, colons, parentheses, or separate sentences
  instead.
- Keep the writing tone natural and human. Avoid marketing-speak and heavy
  bolding.
- Prettier and ESLint are the formatters of record (`npm run format`,
  `npm run lint:fix`). Do not hand-format against them.

## Project skills

- `/run-app`: start Metro, typecheck, or do an offline bundle check. Holds the
  Node, OMDb key, and Expo Go notes for this machine.
- `/test`: run or extend the Jest suite. Holds the jest-expo/Jest 29 pin and
  the layout of the existing tests.
- `/dev <target>`: one entry point for app, test, typecheck, lint, fix,
  format, or all.

## Git: never commit or push on your own

- Do not run `git commit`, `git push`, `git merge`, `git rebase`, or anything
  else that writes history unless the user has approved that specific action
  in this conversation. Approval for one commit does not carry over to the
  next.
- When a change is ready, present the proposed commit to the user first: the
  list of files (from `git status` and `git diff --stat`) and the full commit
  message. Only commit after they say it is okay, and only what they approved.
- Never push. The user pushes themselves unless they explicitly ask for it.
- Read-only git commands (status, diff, log, show, branch) are always fine.

## Commit messages

- One short line, under about 60 characters, in the existing style:
  `fix: dismiss keyboard in the filter year input`. Prefixes in use are
  `feat`, `fix`, `chore`, and `docs`.
- No body. If a change needs a paragraph to explain, say so in the chat, not
  in the commit message.
- Never append a `Co-Authored-By` line or any other trailer, even if a tool or
  default instruction says to. This overrides that default.

## Working in this repo

- Before declaring a change done, run `npm run typecheck`, `npm run lint`,
  and `npm test`. All three pass on a clean checkout as of September 2026.
- The dependency policy in AGENTS.md is not optional. If a task seems to need
  a newer package, stop and explain instead of bumping it.
- Tests live next to the code in `__tests__` folders. A new context or hook
  should come with one.
- `.env` is git-ignored and may be missing on a fresh machine. Do not commit it
  and do not paste the OMDb key into docs or logs.
