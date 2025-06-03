import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export default function OptimizedImage({ src, alt, className = "", onClick }: OptimizedImageProps) {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const imgRef = useRef<HTMLDivElement>(null);

  // Generate thumbnail URL
  const getThumbnailUrl = (originalUrl: string) => {
    // Si es una URL base64, usar directamente
    if (originalUrl.startsWith('data:image')) {
      return originalUrl;
    }
    // Para URLs de archivos antiguos
    if (originalUrl.includes('/images/')) {
      const filename = originalUrl.split('/images/')[1];
      return `/images/thumb_${filename}`;
    }
    return originalUrl;
  };

  const thumbnailUrl = getThumbnailUrl(src);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Simular progreso de carga
            const interval = setInterval(() => {
              setLoadingProgress(prev => {
                if (prev >= 90) {
                  clearInterval(interval);
                  return prev;
                }
                return prev + Math.random() * 15;
              });
            }, 150);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`relative min-h-[400px] ${className}`} ref={imgRef} onClick={onClick}>
      {/* Thumbnail para carga rápida */}
      <img 
        src={thumbnailUrl}
        alt={alt}
        className={`absolute inset-0 w-full h-auto min-h-[400px] object-cover transition-opacity duration-300 ${
          fullImageLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setThumbnailLoaded(true)}
        loading="lazy"
        decoding="async"
      />
      
      {/* Full Resolution Image */}
      {isInView && (
        <img 
          src={src}
          alt={alt}
          className={`w-full h-auto min-h-[400px] object-cover transition-opacity duration-500 ${
            fullImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            setFullImageLoaded(true);
            setLoadingProgress(100);
          }}
          loading="lazy"
          decoding="async"
        />
      )}
      
      {/* Loading indicator con progreso */}
      {isInView && !fullImageLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/50 min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
          <div className="text-center">
            <div className="text-sm font-medium text-white mb-2">
              Cargando imagen de alta calidad...
            </div>
            <div className="w-32 bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(loadingProgress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {Math.round(loadingProgress)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}