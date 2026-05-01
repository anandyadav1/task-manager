import { create } from 'zustand';

const useUiStore = create((set) => ({
  // Dark mode
  darkMode: localStorage.getItem('darkMode') === 'true',
  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.darkMode;
      localStorage.setItem('darkMode', newMode);
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { darkMode: newMode };
    }),
  initDarkMode: () => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    set({ darkMode: isDark });
  },

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Global search
  searchOpen: false,
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setSearchOpen: (open) => set({ searchOpen: open }),

  // Task detail panel
  selectedTaskId: null,
  selectedProjectId: null,
  setSelectedTask: (taskId, projectId) => set({ selectedTaskId: taskId, selectedProjectId: projectId }),
  clearSelectedTask: () => set({ selectedTaskId: null, selectedProjectId: null }),

  // View mode (kanban / list)
  taskViewMode: localStorage.getItem('taskViewMode') || 'kanban',
  setTaskViewMode: (mode) => {
    localStorage.setItem('taskViewMode', mode);
    set({ taskViewMode: mode });
  },
}));

export default useUiStore;
