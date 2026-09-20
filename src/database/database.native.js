import * as SQLite from 'expo-sqlite';

// Veritabanını aç (Expo SDK 54 için yeni API)
let db = null;

// Veritabanını başlat
export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync('focus_tracker.db');
    
    // Seanslar tablosu
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        duration INTEGER NOT NULL,
        distractions INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        date TEXT NOT NULL
      );
    `);

    // Ayarlar tablosu
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Özel kategoriler tablosu
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS custom_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        defaultDuration INTEGER NOT NULL,
        icon TEXT NOT NULL
      );
    `);

    // Notlar tablosu
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        sessionId TEXT,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'daily'
      );
    `);

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Seans kaydet
export const saveSession = async (session) => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    await db.runAsync(
      `INSERT INTO sessions (id, category, duration, distractions, completed, date)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        session.id || Date.now().toString(),
        session.category,
        session.duration,
        session.distractions || 0,
        session.completed ? 1 : 0,
        session.date || new Date().toISOString(),
      ]
    );
    return true;
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

// Tüm seansları getir
export const getSessions = async () => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    const result = await db.getAllAsync('SELECT * FROM sessions ORDER BY date DESC;');
    return result.map((row) => ({
      ...row,
      completed: row.completed === 1,
    }));
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
};

// Ayarları kaydet
export const saveSetting = async (key, value) => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    await db.runAsync(
      `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);`,
      [key, JSON.stringify(value)]
    );
    return true;
  } catch (error) {
    console.error('Error saving setting:', error);
    throw error;
  }
};

// Ayar getir
export const getSetting = async (key) => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    const result = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?;', [key]);
    if (result) {
      try {
        return JSON.parse(result.value);
      } catch (e) {
        return result.value;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting setting:', error);
    return null;
  }
};

// Tüm ayarları getir
export const getSettings = async () => {
  const duration = await getSetting('duration');
  const theme = await getSetting('theme');
  const categoryDurations = await getSetting('categoryDurations');
  const hiddenCategories = await getSetting('hiddenCategories');
  
  return {
    duration: duration || 25,
    theme: theme || 'auto',
    categoryDurations: categoryDurations || {},
    hiddenCategories: hiddenCategories || [],
  };
};

// Ayarları kaydet (toplu)
export const saveSettings = async (settings) => {
  for (const [key, value] of Object.entries(settings)) {
    await saveSetting(key, value);
  }
};

// Özel kategori kaydet
export const saveCustomCategory = async (category) => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    await db.runAsync(
      `INSERT OR REPLACE INTO custom_categories (id, name, color, defaultDuration, icon)
       VALUES (?, ?, ?, ?, ?);`,
      [
        category.id,
        category.name,
        category.color,
        category.defaultDuration,
        category.icon,
      ]
    );
    return true;
  } catch (error) {
    console.error('Error saving custom category:', error);
    throw error;
  }
};

// Tüm özel kategorileri getir
export const getCustomCategories = async () => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    return await db.getAllAsync('SELECT * FROM custom_categories;');
  } catch (error) {
    console.error('Error getting custom categories:', error);
    return [];
  }
};

// Özel kategori sil
export const deleteCustomCategory = async (categoryId) => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    await db.runAsync('DELETE FROM custom_categories WHERE id = ?;', [categoryId]);
    return true;
  } catch (error) {
    console.error('Error deleting custom category:', error);
    throw error;
  }
};

// Tüm özel kategorileri kaydet (toplu)
export const saveCustomCategories = async (categories) => {
  // Önce tümünü sil
  const existing = await getCustomCategories();
  for (const cat of existing) {
    await deleteCustomCategory(cat.id);
  }
  
  // Sonra yenilerini ekle
  for (const category of categories) {
    await saveCustomCategory(category);
  }
};

// Belirli bir tarih aralığındaki seansları getir
export const getSessionsByDateRange = async (startDate, endDate) => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    const result = await db.getAllAsync(
      `SELECT * FROM sessions 
       WHERE date >= ? AND date <= ? 
       ORDER BY date DESC;`,
      [startDate.toISOString(), endDate.toISOString()]
    );
    return result.map((row) => ({
      ...row,
      completed: row.completed === 1,
    }));
  } catch (error) {
    console.error('Error getting sessions by date range:', error);
    return [];
  }
};

// Not kaydet
export const saveNote = async (note) => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    await db.runAsync(
      `INSERT OR REPLACE INTO notes (id, sessionId, content, date, type)
       VALUES (?, ?, ?, ?, ?);`,
      [
        note.id || Date.now().toString(),
        note.sessionId || null,
        note.content,
        note.date || new Date().toISOString(),
        note.type || 'daily',
      ]
    );
    return true;
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
};

// Tüm notları getir
export const getNotes = async () => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    return await db.getAllAsync('SELECT * FROM notes ORDER BY date DESC;');
  } catch (error) {
    console.error('Error getting notes:', error);
    return [];
  }
};

// Belirli bir seansa ait notları getir
export const getNotesBySessionId = async (sessionId) => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    return await db.getAllAsync(
      'SELECT * FROM notes WHERE sessionId = ? ORDER BY date DESC;',
      [sessionId]
    );
  } catch (error) {
    console.error('Error getting notes by session:', error);
    return [];
  }
};

// Not sil
export const deleteNote = async (noteId) => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    await db.runAsync('DELETE FROM notes WHERE id = ?;', [noteId]);
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Not ara
export const searchNotes = async (searchText) => {
  try {
    if (!db) {
      await initDatabase();
    }
    
    return await db.getAllAsync(
      `SELECT * FROM notes 
       WHERE content LIKE ? 
       ORDER BY date DESC;`,
      [`%${searchText}%`]
    );
  } catch (error) {
    console.error('Error searching notes:', error);
    return [];
  }
};
