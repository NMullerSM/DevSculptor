import { create } from 'zustand';

export const WALLPAPERS = [
  { id: 'alps', name: 'Alpinismo Apple', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2560&auto=format&fit=crop' },
  { id: 'lake', name: 'Lago Glaciar', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2560&auto=format&fit=crop' },
  { id: 'forest', name: 'Niebla Nórdica', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2560&auto=format&fit=crop' },
  { id: 'aurora', name: 'Aurora Espacial', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2560&auto=format&fit=crop' },
];

interface ThemeState {
  theme: 'dark' | 'light';
  wallpaperIndex: number;
  currentWallpaperUrl: string;

  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setWallpaperUrl: (url: string) => void;
  nextWallpaper: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  wallpaperIndex: 0,
  currentWallpaperUrl: WALLPAPERS[0].url,

  initTheme: () => {
    const savedTheme = (localStorage.getItem('ds_theme') as 'dark' | 'light') || 'dark';
    const savedWallpaperUrl = localStorage.getItem('ds_wallpaper_url');
    const savedWallpaperIdx = parseInt(localStorage.getItem('ds_wallpaper_idx') || '0', 10);
    const validIdx = isNaN(savedWallpaperIdx) ? 0 : savedWallpaperIdx % WALLPAPERS.length;
    const finalWallpaperUrl = savedWallpaperUrl || WALLPAPERS[validIdx].url;

    const html = document.documentElement;
    if (savedTheme === 'light') {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }

    set({
      theme: savedTheme,
      wallpaperIndex: validIdx,
      currentWallpaperUrl: finalWallpaperUrl,
    });
  },

  setTheme: (newTheme: 'dark' | 'light') => {
    const html = document.documentElement;
    if (newTheme === 'light') {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }
    localStorage.setItem('ds_theme', newTheme);
    set({ theme: newTheme });
  },

  setWallpaperUrl: (url: string) => {
    localStorage.setItem('ds_wallpaper_url', url);
    set({ currentWallpaperUrl: url });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  nextWallpaper: () => {
    const nextIdx = (get().wallpaperIndex + 1) % WALLPAPERS.length;
    const nextUrl = WALLPAPERS[nextIdx].url;
    localStorage.setItem('ds_wallpaper_idx', nextIdx.toString());
    localStorage.setItem('ds_wallpaper_url', nextUrl);
    set({
      wallpaperIndex: nextIdx,
      currentWallpaperUrl: nextUrl,
    });
  },
}));
