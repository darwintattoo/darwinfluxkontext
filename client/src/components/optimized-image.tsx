import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export default function OptimizedImage({ src, alt, className = "", onClick }: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Use original image directly - no thumbnails
  const thumbnailUrl = src;

  // Intersection Observer for lazy loading
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
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`relative min-h-[400px] ${className}`} ref={imgRef} onClick={onClick}>
      {/* Placeholder/Thumbnail */}
      <img 
        src={isInView ? thumbnailUrl : ''}
        alt={alt}
        className={`w-full h-auto min-h-[400px] object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-0 absolute inset-0' : 'opacity-100'
        }`}
        loading="lazy"
        decoding="async"
      />
      
      {/* Full Resolution Image */}
      {isInView && (
        <img 
          src={src}
          alt={alt}
          className={`w-full h-auto min-h-[400px] object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
          decoding="async"
        />
      )}
      
      {/* Loading indicator */}
      {isInView && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}