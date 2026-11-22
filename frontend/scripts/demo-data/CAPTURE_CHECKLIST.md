# Recapturing the screenshots with demo data

The current screenshots contain test data ("Football Freak", "hi I am gopd") and most Cards-view files show a different screen from their name (docs/APP_AUDIT.md §13). Recapture once, and the site and posters update with `pnpm sync:screenshots && pnpm posters`.

## 1. Demo persona
- Display name: **Asha** (Profile → display name), motto "Small things, done often.", location "Pune"
- Currency ₹, monthly budget ₹25,000 (Settings → Money)

## 2. Demo content (enter by hand or with Quick Capture; nothing personal)
| Module | Items |
|---|---|
| Tasks | "Call the bank about the card" (today, high) · "Submit the lab report" (Fri) · "Book train to Pune" · "Water the plants" (done) |
| Notes | "Ideas for the moodboard: deckled paper, oxblood wax" (pinned) · "Books to read this winter" · "Trip to Goa: packing thoughts" |
| Planner | "Dinner with Riya" Fri 8 pm · "Dentist" Tue 11 am |
| Habits | "Read 10 pages" (run of 12 days) · "Walk 20 minutes" |
| Expenses | Groceries ₹1,240 (Food & Dining) · Metro card ₹500 (Transport) · Music ₹119 (Subscriptions, recurring) · category limit Food & Dining ₹6,000 |
| Journal | "A quiet Sunday" (mood: Calm) |
| Travel | "Goa" 12–16 Dec with a packing list |
| Moodboard | 3 pins from your own photos with notes on the back |
| Wardrobe | 4 garments + 1 outfit |
| Nodo | Ask: "What should I focus on today?" |

## 3. Files to capture (both themes, same names as before, 1084×2412)
Cards view = `0N_bento_<screen>_<light|dark>.png`; Editorial view = `0N_<screen>_<light|dark>.png`.

| # | Screen | Cards | Editorial |
|---|---|---|---|
| 01 | Home | `01_bento_home_*` (**currently shows Expenses**) | `01_home_*` |
| 02 | Notes | `02_bento_notes_*` (**currently Travel**) | `02_notes_*` |
| 03 | Tasks | `03_bento_tasks_*` (**currently Journal**) | `03_tasks_*` |
| 04 | Planner | `04_bento_planner_*` (**currently Moodboard**) | `04_plan_*` |
| 05 | Habits | `05_bento_habits_*` (**currently Expenses**) | `05_habits_*` |
| 06 | Expenses | `06_bento_expenses_*` (**currently Home**) | `06_expenses_*` |
| 07 | Focus Dial | `07_bento_dial_*` (**currently Quick add**) | `07_focus_dial_*` |
| 08 | Nodo | `08_bento_nodo_ai_*` | `08_nodo_ai_*` (new) |
| 09 | Wardrobe | `09_bento_wardrobe_*` | `09_wardrobe_*` |
| 10 | Travel | `10_bento_travel_*` | `10_travel_*` |
| 11 | Journal | `11_bento_journal_*` | `11_journal_*` |
| 12 | Moodboard | `12_bento_moodboard_*` | `12_moodboard_*` |
| 13 | Shopping | `13_bento_shopping_*` | `13_shopping_*` |
| 14 | Vault (locked) | `14_bento_vault_*` | – |
| 15 | Curator Passport | `15_bento_profile_*` | – |
| 16 | Widget Studio | `16_widgets_*` | – |
| 17 | Check-in seal | `17_checkin_*` | – |
| 18 | Streak calendar | `18_streak_*` | – |
| 19 | Map of notes | `19_notes_graph_*` | – |
| 20 | Settings → Nodo assistant (memories) | `20_nodo_memory_*` | – |

Then update `scripts/screenshot-map.json` with what each new file shows, run `pnpm sync:screenshots && pnpm posters`, and commit.
