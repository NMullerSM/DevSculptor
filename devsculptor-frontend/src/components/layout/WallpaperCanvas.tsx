import React, { useState, useEffect, useRef } from 'react';

interface WallpaperCanvasProps {
  currentWallpaperUrl?: string;
}

const DEFAULT_WALLPAPER =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2560&auto=format&fit=crop';

export const WallpaperCanvas: React.FC<WallpaperCanvasProps> = ({ currentWallpaperUrl }) => {
  const targetUrl = currentWallpaperUrl || DEFAULT_WALLPAPER;

  // Estado de doble capa para lograr cross-fade suave (fade-out / fade-in) homogéneo
  const [displayedUrl, setDisplayedUrl] = useState(targetUrl);
  const [incomingUrl, setIncomingUrl] = useState<string | null>(null);
  const [isCrossFading, setIsCrossFading] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetUrl === displayedUrl) return;

    // Precargar la imagen en memoria para evitar parpadeos o pantallas vacías
    const img = new Image();
    img.src = targetUrl;

    const startTransition = () => {
      setIncomingUrl(targetUrl);

      // Iniciar el fade simultáneo tras montaje del nuevo layer
      requestAnimationFrame(() => {
        setIsCrossFading(true);
      });

      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = window.setTimeout(() => {
        setDisplayedUrl(targetUrl);
        setIncomingUrl(null);
        setIsCrossFading(false);
      }, 500); // Duración de transición de 500ms
    };

    img.onload = startTransition;
    img.onerror = () => {
      // Fallback si la imagen externa falla
      setDisplayedUrl(targetUrl);
      setIncomingUrl(null);
      setIsCrossFading(false);
    };

    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, [targetUrl, displayedUrl]);

  return (
    <div className="wallpaper-canvas" aria-hidden="true">
      {/* Capa Base Actual: Desvanece a 0 cuando hay transición entrante */}
      <div
        id="wallpaper-bg"
        className="wallpaper-img"
        style={{
          backgroundImage: `url('${displayedUrl}')`,
          opacity: isCrossFading ? 0 : 1,
          transition: 'opacity 500ms ease-in-out',
        }}
      />

      {/* Capa Entrante: Aparece gradualmente de 0 a 1 con la misma curva */}
      {incomingUrl && (
        <div
          id="wallpaper-incoming"
          className="wallpaper-img"
          style={{
            backgroundImage: `url('${incomingUrl}')`,
            opacity: isCrossFading ? 1 : 0,
            transition: 'opacity 500ms ease-in-out',
          }}
        />
      )}

      {/* Capas Escénicas visionOS */}
      <div className="wallpaper-wave-overlay" />
      <div className="wallpaper-topo-pattern" />
      <div className="ambient-orb orb-indigo" />
      <div className="ambient-orb orb-cyan" />
      <div className="ambient-orb orb-purple" />
    </div>
  );
};
