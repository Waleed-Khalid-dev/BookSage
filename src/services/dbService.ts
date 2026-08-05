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

  // Migrations for existing databases
  const migrations = [
    'ALTER TABLE books ADD COLUMN last_page INTEGER DEFAULT 1',
    'ALTER TABLE books ADD COLUMN reading_time_secs INTEGER DEFAULT 0',
    'ALTER TABLE books ADD COLUMN pages_read_total INTEGER DEFAULT 0',
    'ALTER TABLE highlights ADD COLUMN note TEXT',
    'ALTER TABLE highlights ADD COLUMN type TEXT DEFAULT "highlight"'
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

export async function deleteBookmark(id: string): Promise<void> {
  const database = await getDb();
  await database.execute('DELETE FROM bookmarks WHERE id = $1', [id]);
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
