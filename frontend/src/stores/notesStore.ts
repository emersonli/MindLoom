import { create } from 'zustand';
import { Note } from '../types';

interface NotesState {
  // State
  notes: Note[];
  selectedNote: Note | null;
  isLoading: boolean;
  error: string | null;
  lastSynced: number | null;

  // Actions - Notes CRUD
  fetchNotes: () => Promise<void>;
  fetchNote: (id: string) => Promise<void>;
  createNote: (title: string, content?: string) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;

  // Actions - UI
  setSelectedNote: (note: Note | null) => void;
  clearError: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useNotesStore = create<NotesState>((set) => ({
  // Initial State
  notes: [],
  selectedNote: null,
  isLoading: false,
  error: null,
  lastSynced: null,

  // Fetch all notes
  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      set({ notes: data.notes || data, isLoading: false, lastSynced: Date.now() });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch notes',
        isLoading: false 
      });
    }
  },

  // Fetch single note
  fetchNote: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const note = await response.json();
      set({ selectedNote: note, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch note',
        isLoading: false 
      });
    }
  },

  // Create new note
  createNote: async (title: string, content?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: content || '<p>新笔记内容...</p>',
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newNote = await response.json();
      set((state) => ({
        notes: [newNote, ...state.notes],
        selectedNote: newNote,
        isLoading: false,
        lastSynced: Date.now(),
      }));
      return newNote;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create note',
        isLoading: false 
      });
      return null;
    }
  },

  // Update note
  updateNote: async (id: string, updates: Partial<Note>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedNote = await response.json();
      set((state) => ({
        notes: state.notes.map(n => n.id === id ? updatedNote : n),
        selectedNote: state.selectedNote?.id === id ? updatedNote : state.selectedNote,
        isLoading: false,
        lastSynced: Date.now(),
      }));
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update note',
        isLoading: false 
      });
      return false;
    }
  },

  // Delete note
  deleteNote: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      set((state) => ({
        notes: state.notes.filter(n => n.id !== id),
        selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
        isLoading: false,
        lastSynced: Date.now(),
      }));
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete note',
        isLoading: false 
      });
      return false;
    }
  },

  // Set selected note
  setSelectedNote: (note: Note | null) => {
    set({ selectedNote: note });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
