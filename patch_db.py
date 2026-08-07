"""Patch dbService.ts for Phase 5 Notes Viewer."""

with open(r'd:\[Project]\BookSage\src\services\dbService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extend ChapterRecord interface
content = content.replace(
    'updated_at: number;\r\n}',
    'updated_at: number;\r\n  user_notes?: string | null;\r\n  studied?: number;\r\n  steps_progress?: string | null;\r\n}\r\n\r\nexport interface ChapterUserData {\r\n  chapter_id: string;\r\n  user_notes: string;\r\n  studied: boolean;\r\n  steps_progress: boolean[];\r\n}',
    1
)

# 2. Extend migrations array
old_mig_end = "    'ALTER TABLE highlights ADD COLUMN type TEXT DEFAULT \"highlight\"'\r\n  ];"
new_mig_end = "    'ALTER TABLE highlights ADD COLUMN type TEXT DEFAULT \"highlight\"',\r\n    // Phase 5 -- Notes Viewer columns\r\n    'ALTER TABLE chapters ADD COLUMN user_notes TEXT',\r\n    'ALTER TABLE chapters ADD COLUMN studied INTEGER DEFAULT 0',\r\n    'ALTER TABLE chapters ADD COLUMN steps_progress TEXT'\r\n  ];"
content = content.replace(old_mig_end, new_mig_end, 1)

# 3. Append new functions
new_funcs = r"""

// --- NOTES VIEWER USER DATA ---

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
"""

content = content.rstrip() + new_funcs

with open(r'd:\[Project]\BookSage\src\services\dbService.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('dbService.ts patched successfully')
print('ChapterUserData added:', 'ChapterUserData' in content)
print('Migrations added:', 'steps_progress TEXT' in content)
print('getChapterUserData added:', 'getChapterUserData' in content)
