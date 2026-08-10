import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export interface BookRecord {
  id: string;
  title: string;
  pdf_path: string | null;
  data_dir: string;
  cover_path: string | null;
  total_chapters: number;
  created_at: number;
  last_opened: number;
  last_page?: number;
  reading_time_secs?: number;
  pages_read_total?: number;
}

export interface ChapterRecord {
  id: string;
  book_id: string;
  num: number;
  title: string;
  pages: string;
  status: 'none' | 'process' | 'done' | 'error';
  txt_path: string | null;
  json_path: string | null;
  error_msg: string | null;
  updated_at: number;
}

export interface HighlightRecord {
  id: string;
  book_id: string;
  page_num: number;
  color: string;
  text: string | null;
  rects: string;
  note?: string | null;
  type?: string | null;
  created_at: number;
}

export interface DrawingRecord {
  id: string;
  book_id: string;
  page_num: number;
  path_data: string;
  color: string;
  stroke_width: number;
  created_at: number;
}

export interface BookmarkRecord {
  id: string;
  book_id: string;
  page_num: number;
  label?: string | null;
  created_at: number;
}

export interface ReadingSessionRecord {
  id: string;
  book_id: string;
  date_str: string;
  pages_read: number;
  time_secs: number;
  created_at: number;
}

export interface SearchResult extends HighlightRecord {
  book_title: string;
}

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:booksage.db');
    await initDb(db);
  }
  return db;
}

async function initDb(database: Database) {
  // Create tables if they do not exist
  await database.execute(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      pdf_path TEXT,
      data_dir TEXT NOT NULL,
      cover_path TEXT,
      total_chapters INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      last_opened INTEGER
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      num INTEGER NOT NULL,
      title TEXT NOT NULL,
      pages TEXT,
      status TEXT DEFAULT 'none',
      txt_path TEXT,
      json_path TEXT,
      error_msg TEXT,
      updated_at INTEGER,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS highlights (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      page_num INTEGER NOT NULL,
      color TEXT NOT NULL,
      text TEXT,
      rects TEXT NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      page_num INTEGER NOT NULL,
      label TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS drawings (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      page_num INTEGER NOT NULL,
      path_data TEXT NOT NULL,
      color TEXT NOT NULL,
      stroke_width REAL NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS reading_sessions (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      date_str TEXT NOT NULL,
      pages_read INTEGER DEFAULT 0,
      time_secs INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
      UNIQUE(book_id, date_str)
    );
  `);

  // Phase 6 – AI Copilot: chat sessions
  await database.execute(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id           TEXT PRIMARY KEY,
      book_id      TEXT REFERENCES books(id) ON DELETE CASCADE,
      title        TEXT NOT NULL DEFAULT 'New Chat',
      messages     TEXT NOT NULL DEFAULT '[]',
      context_mode TEXT NOT NULL DEFAULT 'chapter',
      model_name   TEXT,
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL
    );
  `);

  // Migrations for existing databases
  const migrations = [
    'ALTER TABLE books ADD COLUMN last_page INTEGER DEFAULT 1',
    'ALTER TABLE books ADD COLUMN reading_time_secs INTEGER DEFAULT 0',
    'ALTER TABLE books ADD COLUMN pages_read_total INTEGER DEFAULT 0',
    'ALTER TABLE highlights ADD COLUMN note TEXT',
    'ALTER TABLE highlights ADD COLUMN type TEXT DEFAULT "highlight"',
    // Phase 5 -- Notes Viewer columns
    'ALTER TABLE chapters ADD COLUMN user_notes TEXT',
    'ALTER TABLE chapters ADD COLUMN studied INTEGER DEFAULT 0',
    'ALTER TABLE chapters ADD COLUMN steps_progress TEXT',
    // Phase 6 -- AI Copilot columns
    'ALTER TABLE chapters ADD COLUMN ai_insights TEXT'
  ];

  for (const query of migrations) {
    try {
      await database.execute(query);
    } catch (e) {
      // Column likely already exists, safe to ignore
    }
  }
}

export async function upsertBook(book: BookRecord): Promise<void> {
  const database = await getDb();
  await database.execute(
    `INSERT INTO books (id, title, pdf_path, data_dir, cover_path, total_chapters, created_at, last_opened, last_page, reading_time_secs, pages_read_total)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT(id) DO UPDATE SET
     title=excluded.title,
     pdf_path=excluded.pdf_path,
     data_dir=excluded.data_dir,
     cover_path=excluded.cover_path,
     total_chapters=excluded.total_chapters,
     last_opened=excluded.last_opened,
     last_page=excluded.last_page,
     reading_time_secs=excluded.reading_time_secs,
     pages_read_total=excluded.pages_read_total`,
    [
      book.id, book.title, book.pdf_path, book.data_dir, book.cover_path, 
      book.total_chapters, book.created_at, book.last_opened, 
      book.last_page ?? 1, book.reading_time_secs ?? 0, book.pages_read_total ?? 0
    ]
  );
}

export async function upsertChapter(chapter: ChapterRecord): Promise<void> {
  const database = await getDb();
  await database.execute(
    `INSERT INTO chapters (id, book_id, num, title, pages, status, txt_path, json_path, error_msg, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT(id) DO UPDATE SET
     status=excluded.status,
     txt_path=excluded.txt_path,
     json_path=excluded.json_path,
     error_msg=excluded.error_msg,
     updated_at=excluded.updated_at`,
    [chapter.id, chapter.book_id, chapter.num, chapter.title, chapter.pages, chapter.status, chapter.txt_path, chapter.json_path, chapter.error_msg, chapter.updated_at]
  );
}

export async function getBook(id: string): Promise<BookRecord | null> {
  const database = await getDb();
  const result = await database.select<BookRecord[]>('SELECT * FROM books WHERE id = $1', [id]);
  return result.length > 0 ? result[0] : null;
}

export async function mergeDuplicateBooks(pdfPath: string): Promise<void> {
  const database = await getDb();
  
  const books = await database.select<BookRecord[]>(`
    SELECT b.*
    FROM books b
    WHERE b.pdf_path = $1
    ORDER BY (
      (SELECT COUNT(*) FROM highlights WHERE book_id = b.id) + 
      (SELECT COUNT(*) FROM bookmarks WHERE book_id = b.id) + 
      (SELECT COUNT(*) FROM chapters WHERE book_id = b.id AND status = 'done')
    ) DESC, b.last_opened DESC
  `, [pdfPath]);

  if (books.length <= 1) return;

  const primary = books[0];
  const duplicates = books.slice(1);

  for (const dup of duplicates) {
    // 1. Move annotations
    await database.execute('UPDATE highlights SET book_id = $1 WHERE book_id = $2', [primary.id, dup.id]);
    await database.execute('UPDATE bookmarks SET book_id = $1 WHERE book_id = $2', [primary.id, dup.id]);
    await database.execute('UPDATE drawings SET book_id = $1 WHERE book_id = $2', [primary.id, dup.id]);

    // 2. Merge chapters
    const primaryChapters = await database.select<ChapterRecord[]>('SELECT * FROM chapters WHERE book_id = $1', [primary.id]);
    const dupChapters = await database.select<ChapterRecord[]>('SELECT * FROM chapters WHERE book_id = $1', [dup.id]);

    for (const dupChap of dupChapters) {
      if (dupChap.status === 'done' || dupChap.status === 'process') {
        const primChap = primaryChapters.find(c => c.num === dupChap.num);
        if (primChap && primChap.status !== 'done') {
          await database.execute(
            'UPDATE chapters SET status = $1, txt_path = $2, json_path = $3, error_msg = $4, updated_at = $5 WHERE id = $6',
            [dupChap.status, dupChap.txt_path, dupChap.json_path, dupChap.error_msg, dupChap.updated_at, primChap.id]
          );
        }
      }
    }

    // 3. Delete duplicate chapters and book
    await database.execute('DELETE FROM chapters WHERE book_id = $1', [dup.id]);
    await database.execute('DELETE FROM books WHERE id = $1', [dup.id]);
  }
}

export async function getBookByPdfPath(pdfPath: string): Promise<BookRecord | null> {
  await mergeDuplicateBooks(pdfPath); // Automatically fix any duplicate bugs

  const database = await getDb();
  const result = await database.select<BookRecord[]>('SELECT * FROM books WHERE pdf_path = $1 LIMIT 1', [pdfPath]);
  return result.length > 0 ? result[0] : null;
}

export async function getChaptersForBook(bookId: string): Promise<ChapterRecord[]> {
  const database = await getDb();
  return await database.select<ChapterRecord[]>('SELECT * FROM chapters WHERE book_id = $1 ORDER BY num ASC', [bookId]);
}

export async function getAllBooks(): Promise<BookRecord[]> {
  const database = await getDb();
  return await database.select<BookRecord[]>('SELECT * FROM books ORDER BY last_opened DESC');
}

export async function updateBookLastOpened(id: string): Promise<void> {
  const database = await getDb();
  const now = Date.now();
  await database.execute('UPDATE books SET last_opened = $1 WHERE id = $2', [now, id]);
}

export async function upsertHighlight(highlight: HighlightRecord): Promise<void> {
  const database = await getDb();
  await database.execute(
    `INSERT INTO highlights (id, book_id, page_num, color, text, rects, note, type, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT(id) DO UPDATE SET
     color=excluded.color,
     rects=excluded.rects,
     note=excluded.note,
     type=excluded.type`,
    [highlight.id, highlight.book_id, highlight.page_num, highlight.color, highlight.text, highlight.rects, highlight.note, highlight.type || 'highlight', highlight.created_at]
  );
}

export async function getHighlightsForBook(bookId: string): Promise<HighlightRecord[]> {
  const database = await getDb();
  return await database.select<HighlightRecord[]>('SELECT * FROM highlights WHERE book_id = $1 ORDER BY page_num ASC, created_at ASC', [bookId]);
}

export async function deleteHighlight(id: string): Promise<void> {
  const database = await getDb();
  await database.execute('DELETE FROM highlights WHERE id = $1', [id]);
}

export async function deleteBookmark(id: string): Promise<void> {
  const database = await getDb();
  await database.execute('DELETE FROM bookmarks WHERE id = $1', [id]);
}

export async function searchAnnotations(query: string): Promise<SearchResult[]> {
  const database = await getDb();
  const wildcardQuery = `%${query}%`;
  return await database.select<SearchResult[]>(
    `SELECT h.*, b.title as book_title 
     FROM highlights h 
     JOIN books b ON h.book_id = b.id 
     WHERE h.text LIKE $1 OR h.note LIKE $1 
     ORDER BY h.created_at DESC`, 
    [wildcardQuery]
  );
}

export async function upsertBookmark(bookmark: BookmarkRecord): Promise<void> {
  const database = await getDb();
  await database.execute(
    `INSERT INTO bookmarks (id, book_id, page_num, label, created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT(id) DO UPDATE SET
     label=excluded.label`,
    [bookmark.id, bookmark.book_id, bookmark.page_num, bookmark.label, bookmark.created_at]
  );
}

export async function getBookmarksForBook(bookId: string): Promise<BookmarkRecord[]> {
  const database = await getDb();
  return await database.select<BookmarkRecord[]>('SELECT * FROM bookmarks WHERE book_id = $1 ORDER BY page_num ASC', [bookId]);
}


export async function upsertDrawing(drawing: DrawingRecord): Promise<void> {
  const database = await getDb();
  await database.execute(
    `INSERT INTO drawings (id, book_id, page_num, path_data, color, stroke_width, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT(id) DO UPDATE SET
     path_data=excluded.path_data,
     color=excluded.color,
     stroke_width=excluded.stroke_width`,
    [drawing.id, drawing.book_id, drawing.page_num, drawing.path_data, drawing.color, drawing.stroke_width, drawing.created_at]
  );
}

export async function getDrawingsForBook(bookId: string): Promise<DrawingRecord[]> {
  const database = await getDb();
  return await database.select<DrawingRecord[]>('SELECT * FROM drawings WHERE book_id = $1 ORDER BY page_num ASC, created_at ASC', [bookId]);
}

export async function deleteDrawing(id: string): Promise<void> {
  const database = await getDb();
  await database.execute('DELETE FROM drawings WHERE id = $1', [id]);
}

export async function undoLastDrawing(bookId: string, pageNum: number): Promise<void> {
  const database = await getDb();
  // Get the most recent drawing ID for this page
  const result = await database.select<{id: string}[]>('SELECT id FROM drawings WHERE book_id = $1 AND page_num = $2 ORDER BY created_at DESC LIMIT 1', [bookId, pageNum]);
  if (result.length > 0) {
    await database.execute('DELETE FROM drawings WHERE id = $1', [result[0].id]);
  }
}

// --- GAMIFICATION / READING STATS ---

export async function recordReadingSession(bookId: string, dateStr: string, addedPages: number, addedTime: number): Promise<void> {
  const database = await getDb();
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  
  await database.execute(
    `INSERT INTO reading_sessions (id, book_id, date_str, pages_read, time_secs, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT(book_id, date_str) DO UPDATE SET
     pages_read = pages_read + excluded.pages_read,
     time_secs = time_secs + excluded.time_secs`,
    [id, bookId, dateStr, addedPages, addedTime, createdAt]
  );
}

export async function getDailyStats(dateStr: string): Promise<{ pages: number, time: number }> {
  const database = await getDb();
  const result = await database.select<any[]>(
    `SELECT SUM(pages_read) as total_pages, SUM(time_secs) as total_time FROM reading_sessions WHERE date_str = $1`,
    [dateStr]
  );
  return {
    pages: result[0]?.total_pages || 0,
    time: result[0]?.total_time || 0
  };
}

export async function getWeeklyStats(startDateStr: string, endDateStr: string): Promise<{ pages: number, time: number }> {
  const database = await getDb();
  const result = await database.select<any[]>(
    `SELECT SUM(pages_read) as total_pages, SUM(time_secs) as total_time FROM reading_sessions WHERE date_str >= $1 AND date_str <= $2`,
    [startDateStr, endDateStr]
  );
  return {
    pages: result[0]?.total_pages || 0,
    time: result[0]?.total_time || 0
  };
}

export async function getReadingStreak(currentDateStr: string): Promise<number> {
  const database = await getDb();
  
  // Get all unique dates where user read at least 1 page
  const result = await database.select<{date_str: string}[]>(
    `SELECT DISTINCT date_str FROM reading_sessions WHERE pages_read > 0 ORDER BY date_str DESC`
  );
  
  if (!result || result.length === 0) return 0;
  
  const dates = result.map(r => r.date_str);
  let streak = 0;
  
  // Parse current date
  let currDate = new Date(currentDateStr);
  
  // Check if today is in the list. If not, check if yesterday is in the list.
  // If neither, streak is 0.
  let todayStr = currDate.toISOString().split('T')[0];
  
  let yesterday = new Date(currDate);
  yesterday.setDate(yesterday.getDate() - 1);
  let yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (!dates.includes(todayStr) && !dates.includes(yesterdayStr)) {
    return 0;
  }
  
  // Count consecutive days backward starting from the most recent reading day (today or yesterday)
  let checkDate = dates.includes(todayStr) ? new Date(currDate) : new Date(yesterday);
  
  while (true) {
    let checkStr = checkDate.toISOString().split('T')[0];
    if (dates.includes(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1); // move back one day
    } else {
      break;
    }
  }
  
  return streak;
}

// --- NOTES VIEWER USER DATA ---

export interface ChapterUserData {
  chapter_id: string;
  user_notes: string;
  studied: boolean;
  steps_progress: any[];
}

export async function getChapterUserData(chapterId: string): Promise<ChapterUserData> {
  const database = await getDb();
  const result = await database.select<any[]>(
    'SELECT user_notes, studied, steps_progress FROM chapters WHERE id = $1',
    [chapterId]
  );
  if (!result || result.length === 0) {
    return { chapter_id: chapterId, user_notes: '', studied: false, steps_progress: [] };
  }
  const row = result[0];
  return {
    chapter_id: chapterId,
    user_notes: row.user_notes || '',
    studied: (row.studied ?? 0) === 1,
    steps_progress: row.steps_progress ? JSON.parse(row.steps_progress) : []
  };
}

export async function saveChapterUserData(chapterId: string, data: Partial<ChapterUserData>): Promise<void> {
  const database = await getDb();
  const fields: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (data.user_notes !== undefined) {
    fields.push(`user_notes = $${paramIdx++}`);
    values.push(data.user_notes);
  }
  if (data.studied !== undefined) {
    fields.push(`studied = $${paramIdx++}`);
    values.push(data.studied ? 1 : 0);
  }
  if (data.steps_progress !== undefined) {
    fields.push(`steps_progress = $${paramIdx++}`);
    values.push(JSON.stringify(data.steps_progress));
  }

  if (fields.length === 0) return;
  values.push(chapterId);
  await database.execute(
    `UPDATE chapters SET ${fields.join(', ')} WHERE id = $${paramIdx}`,
    values
  );
}

export async function getStudiedCountForBook(bookId: string): Promise<{ studied: number; total: number }> {
  const database = await getDb();
  const result = await database.select<any[]>(
    'SELECT COUNT(*) as total, SUM(CASE WHEN studied = 1 THEN 1 ELSE 0 END) as studied FROM chapters WHERE book_id = $1 AND status = "done"',
    [bookId]
  );
  if (!result || result.length === 0) return { studied: 0, total: 0 };
  return {
    studied: result[0].studied || 0,
    total: result[0].total || 0
  };
}

// ─── PHASE 6: AI COPILOT CHAT SESSIONS ───────────────────────────────────────

export interface ChatMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

export interface ChatSessionRecord {
  id: string;
  book_id: string | null;
  title: string;
  messages: string;        // JSON-serialised ChatMessageRecord[]
  context_mode: 'chapter' | 'book' | 'custom';
  model_name: string | null;
  created_at: number;
  updated_at: number;
}

export async function saveChatSession(session: ChatSessionRecord): Promise<void> {
  const database = await getDb();
  await database.execute(
    `INSERT INTO chat_sessions (id, book_id, title, messages, context_mode, model_name, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT(id) DO UPDATE SET
       title        = excluded.title,
       messages     = excluded.messages,
       context_mode = excluded.context_mode,
       model_name   = excluded.model_name,
       updated_at   = excluded.updated_at`,
    [
      session.id, session.book_id, session.title, session.messages,
      session.context_mode, session.model_name,
      session.created_at, session.updated_at,
    ]
  );
}

export async function getAllChatSessions(bookId: string): Promise<ChatSessionRecord[]> {
  const database = await getDb();
  return await database.select<ChatSessionRecord[]>(
    'SELECT * FROM chat_sessions WHERE book_id = $1 ORDER BY updated_at DESC',
    [bookId]
  );
}

export async function deleteChatSession(id: string): Promise<void> {
  const database = await getDb();
  await database.execute('DELETE FROM chat_sessions WHERE id = $1', [id]);
}

export async function pinChapterInsight(chapterId: string, insight: string): Promise<void> {
  const database = await getDb();
  const result = await database.select<{ ai_insights: string | null }[]>(
    'SELECT ai_insights FROM chapters WHERE id = $1',
    [chapterId]
  );
  const existing: string[] = result[0]?.ai_insights
    ? JSON.parse(result[0].ai_insights)
    : [];
  existing.push(insight);
  await database.execute(
    'UPDATE chapters SET ai_insights = $1 WHERE id = $2',
    [JSON.stringify(existing), chapterId]
  );
}

export async function getChapterInsights(chapterId: string): Promise<string[]> {
  const database = await getDb();
  const result = await database.select<{ ai_insights: string | null }[]>(
    'SELECT ai_insights FROM chapters WHERE id = $1',
    [chapterId]
  );
  return result[0]?.ai_insights ? JSON.parse(result[0].ai_insights) : [];
}
