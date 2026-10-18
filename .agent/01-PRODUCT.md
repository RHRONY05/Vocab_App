# 01 — Product

## The problem
Rony meets unknown English words all day on his laptop. The old n8n agent explained words well,
but saved words went into a Notion table he never opened, so nothing was reviewed or remembered.

## The product in one paragraph
A private web app with three tabs. **Learn**: type a word, get a short, practical explanation
(meaning, Bangla meaning, how it's used, collocations, patterns, examples, what not to confuse it
with), and save it with one click. **Words**: everything saved, by today / this week / this month /
all, with search and progress. **Review**: a daily review of the words that are due (spaced
repetition), plus quick practice rounds on this week's, this month's, or the weakest words.

## User stories
| ID | As the user I want to… | Notes |
|---|---|---|
| L0 | open the app and see at a glance what I saved today, what's due, and my recent words | Learn empty state (design D03). |
| L1 | type a word and get the explanation fast, without being asked questions back | The app never ends with "Your turn" or a question. |
| L2 | see the Bangla meaning, or hide it | Toggle, remembered. Default on. |
| L3 | ask a follow-up about the current word ("is it formal?", "difference with X?") | Short reply about the current word. |
| L4 | paste my own sentence with the word and have it checked | Only when I send one. Says if it's natural, corrects gently, explains in 1–2 lines. |
| L5 | save a word with one click or `Ctrl+S` | Never auto-save. |
| L6 | be told when I look up a word I already saved | Show the saved card instantly + "You've looked this up N times. Added to today's review." |
| L7 | look a word up straight from the browser address bar | `/?q=<word>` runs the lookup on load. README explains adding a browser search shortcut. |
| W1 | see words saved today / this week / this month / all, with counts | Times in `Asia/Dhaka`. |
| W2 | search my words and open a word's full card | |
| W3 | see my progress at a glance | New / Learning / Mastered counts, reviewed today, due today. |
| W4 | delete a word | With confirmation. |
| R0 | see how many words are due, how long it takes, and which words, before I start | Review start card; "All caught up" + next review date when nothing is due. |
| R1 | do a daily review of only the words that are due, in a few minutes | Capped at 15 per session. Weakest first. |
| R2 | practise this week's / this month's / all / weak words in a 5, 10 or 20-question round | Weighted random: weaker words come up more often. |
| R3 | see the answer hidden until I choose | Then the explanation and a Next button. |
| R4 | answer with the keyboard | 1–4 to choose, Enter/Space for next. |
| R5 | see my score, how many words moved up, and missed words at the end | Missed words link to their cards. |

## Out of scope (do NOT build)
Multiple users, sign-up, PWA/offline, mobile app, voice/audio, tags/categories, streaks,
achievement badges, animations (beyond simple hover/focus transitions), images beyond the
illustrations in `design/illustrations/`, notifications/emails, chat history in the database,
Notion/n8n integration, to-do / money / project-tracking modules, UI translation, analytics.
