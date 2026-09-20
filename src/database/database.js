import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  sessions: 'web_sessions',
  settings: 'web_settings',
  categories: 'web_custom_categories',
  notes: 'web_notes',
};

async function read(key, fallback) {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

async function write(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const initDatabase = async () => true;

export const saveSession = async (session) => {
  const sessions = await read(KEYS.sessions, []);
  sessions.push({
    id: session.id || Date.now().toString(),
    category: session.category,
    duration: session.duration,
    distractions: session.distractions || 0,
    completed: Boolean(session.completed),
    date: session.date || new Date().toISOString(),
  });
  await write(KEYS.sessions, sessions);
  return true;
};

export const getSessions = async () => {
  const sessions = await read(KEYS.sessions, []);
  return sessions.sort((a, b) => (a.date < b.date ? 1 : -1));
};

export const saveSetting = async (key, value) => {
  const settings = await read(KEYS.settings, {});
  settings[key] = value;
  await write(KEYS.settings, settings);
  return true;
};

export const getSetting = async (key) => {
  const settings = await read(KEYS.settings, {});
  return settings[key] ?? null;
};

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

export const saveSettings = async (settings) => {
  for (const [key, value] of Object.entries(settings)) {
    await saveSetting(key, value);
  }
};

export const saveCustomCategory = async (category) => {
  const categories = await getCustomCategories();
  const next = categories.filter((item) => item.id !== category.id);
  next.push(category);
  await write(KEYS.categories, next);
  return true;
};

export const getCustomCategories = async () => read(KEYS.categories, []);

export const deleteCustomCategory = async (categoryId) => {
  const categories = await getCustomCategories();
  await write(
    KEYS.categories,
    categories.filter((item) => item.id !== categoryId)
  );
  return true;
};

export const saveCustomCategories = async (categories) => {
  await write(KEYS.categories, categories);
};

export const getSessionsByDateRange = async (startDate, endDate) => {
  const sessions = await getSessions();
  const start = startDate.toISOString();
  const end = endDate.toISOString();
  return sessions.filter((session) => session.date >= start && session.date <= end);
};

export const saveNote = async (note) => {
  const notes = await getNotes();
  const record = {
    id: note.id || Date.now().toString(),
    sessionId: note.sessionId || null,
    content: note.content,
    date: note.date || new Date().toISOString(),
    type: note.type || 'daily',
  };
  const next = notes.filter((item) => item.id !== record.id);
  next.unshift(record);
  await write(KEYS.notes, next);
  return true;
};

export const getNotes = async () => {
  const notes = await read(KEYS.notes, []);
  return notes.sort((a, b) => (a.date < b.date ? 1 : -1));
};

export const getNotesBySessionId = async (sessionId) => {
  const notes = await getNotes();
  return notes.filter((note) => note.sessionId === sessionId);
};

export const deleteNote = async (noteId) => {
  const notes = await getNotes();
  await write(
    KEYS.notes,
    notes.filter((note) => note.id !== noteId)
  );
  return true;
};

export const searchNotes = async (searchText) => {
  const notes = await getNotes();
  const query = searchText.toLowerCase();
  return notes.filter((note) => (note.content || '').toLowerCase().includes(query));
};
