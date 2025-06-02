import { useState, useRef, useEffect, useCallback } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export default function OptimizedImage({ src, alt, className = "", onClick }: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Optimize image URL for faster loading
  const getOptimizedUrl = useCallback((originalUrl: string) => {
    // If it's a base64 image, return as is
    if (originalUrl.startsWith('data:image/')) {
      return originalUrl;
    }
    
    // For file URLs, add cache busting and optimize
    if (originalUrl.includes('/images/')) {
      return `${originalUrl}?w=400&q=80&t=${Date.now()}`;
    }
    
    return originalUrl;
  }, []);

  useEffect(() => {
    setImageUrl(getOptimizedUrl(src));
  }, [src, getOptimizedUrl]);

  // Intersection Observer for lazy loading with improved performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        threshold: 0.1, 
        rootMargin: '100px' // Load images earlier for better perceived performance
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    // Hide the broken image completely
    if (imgRef.current) {
      imgRef.current.style.display = 'none';
    }
  }, []);

  if (hasError) {
    return null; // Hide broken images completely
  }

  return (
    <div className={`relative overflow-hidden ${className}`} ref={imgRef} onClick={onClick}>
      {/* Optimized single image with proper error handling */}
      {isInView && (
        <img 
          src={imageUrl}
          alt={alt}
          className={`w-full h-auto transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-20'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
          style={{ 
            minHeight: '200px',
            objectFit: 'cover',
            backgroundColor: '#1e293b'
          }}
        />
      )}
      
      {/* Skeleton loading state */}
      {isInView && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-800/50 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
      
      {/* Placeholder before loading */}
      {!isInView && (
        <div className="w-full h-48 bg-slate-800/30 animate-pulse" />
      )}
    </div>
  );
}