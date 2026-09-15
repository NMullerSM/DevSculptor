import React from 'react';

interface WallpaperCanvasProps {
  currentWallpaperUrl?: string;
}

export const WallpaperCanvas: React.FC<WallpaperCanvasProps> = ({ currentWallpaperUrl }) => {
  const defaultWallpaper = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2560&auto=format&fit=crop';
  const bgStyle = {
    backgroundImage: `url('${currentWallpaperUrl || defaultWallpaper}')`,
  };

  return (
    <div className="wallpaper-canvas" aria-hidden="true">
      <div id="wallpaper-bg" className="wallpaper-img" style={bgStyle} />
      <div className="wallpaper-wave-overlay" />
      <div className="wallpaper-topo-pattern" />
      <div className="ambient-orb orb-indigo" />
      <div className="ambient-orb orb-cyan" />
      <div className="ambient-orb orb-purple" />
    </div>
  );
};
