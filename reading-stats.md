# Reading Stats & Gamification Plan

## Overview
Implement advanced reading statistics and gamification features as outlined in the feature research document. We analyzed the current implementation and found that "Time spent reading per book" is already completed (via `reading_time_secs` in `books` table). The remaining features require tracking reading sessions by date to calculate daily/weekly stats and streaks, as well as calculating reading speed for time estimates.

## Project Type
WEB (React + Tauri + SQLite)

## Success Criteria
- Users can see an estimated time remaining ("X min left") for the current book.
- Users can see total pages read today and this week.
- Users can see their current daily reading streak (e.g., "🔥 3 Day Streak").
- The database efficiently tracks daily reading sessions without performance hits during rapid scrolling.

## Tech Stack
- **Database**: SQLite (via `@tauri-apps/plugin-sql`) for a new `reading_sessions` table.
- **State Management**: Zustand (`bookStore.ts`) for caching global stats.
- **UI**: React / Lucide Icons for updating `ReadingStats.tsx` and adding gamification badges.

## File Structure
- `src/services/dbService.ts` (Modified: add `reading_sessions` table)
- `src/stores/bookStore.ts` (Modified: update stats tracking)
- `src/components/reader/ReadingStats.tsx` (Modified: add new UI metrics)

## Task Breakdown

### Task 1: Database Schema & Service Updates
- **Agent**: `backend-specialist`
- **Skill**: `database-design`
- **INPUT**: Current `dbService.ts`
- **OUTPUT**:
  - `CREATE TABLE IF NOT EXISTS reading_sessions (id, book_id, date_str, pages_read, time_secs)`
  - Migration script for existing DB.
  - New DB functions: `recordReadingSession()`, `getDailyStats()`, `getWeeklyStats()`, `getReadingStreak()`.
- **VERIFY**: Unit test or manual call to ensure `reading_sessions` records are created and aggregated correctly.

### Task 2: Store Integration
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-architecture`
- **INPUT**: `dbService.ts` updates, `bookStore.ts`
- **OUTPUT**: 
  - Update `incrementReadingStats` in `bookStore` to call `recordReadingSession` with the current date (YYYY-MM-DD).
  - Add state variables: `dailyPages`, `weeklyPages`, `currentStreak`.
  - Add action: `fetchGlobalStats()`.
- **VERIFY**: Verify that reading pages in the app increments both the `books` table and the `reading_sessions` table.

### Task 3: Reading Time Estimate Logic
- **Agent**: `frontend-specialist`
- **Skill**: `clean-code`
- **INPUT**: `ReadingStats.tsx`
- **OUTPUT**: 
  - Logic to calculate average time per page (`readingTimeSecs / pagesReadTotal`).
  - Calculate `estimatedSecondsLeft = avgTimePerPage * pagesRemaining`.
  - Add safe fallbacks (e.g., if pagesRead < 5, say "Calculating estimate...").
- **VERIFY**: UI shows a reasonable minute estimate that updates as the user reads faster/slower.

### Task 4: UI Gamification Updates
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **INPUT**: `ReadingStats.tsx`
- **OUTPUT**:
  - Add "X min left" to the current book stats.
  - Add a new "Global Stats" section showing "Pages Today", "Pages This Week".
  - Add a prominent "🔥 X Day Streak" badge.
- **VERIFY**: The UI matches the existing premium dark/light mode aesthetics without cluttering the modal.

## Phase X: Verification
- [ ] Run `npm run lint` and `npx tsc --noEmit`
- [ ] Verify that reading a few pages updates the "Pages Today" counter.
- [ ] Verify that the time estimate is mathematically sound.
- [ ] Socratic Gate was respected.
