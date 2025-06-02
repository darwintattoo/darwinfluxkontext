import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { GeneratedImage } from "@shared/schema";

export function useFastGallery() {
  const queryClient = useQueryClient();
  const [localImages, setLocalImages] = useState<GeneratedImage[]>([]);

  // Load from localStorage on mount for instant display
  useEffect(() => {
    try {
      const cached = localStorage.getItem('cached_images');
      if (cached) {
        const images = JSON.parse(cached);
        setLocalImages(images);
      }
    } catch (e) {
      // Invalid cache, clear it
      try {
        localStorage.removeItem('cached_images');
      } catch (cleanupError) {
        // Storage is completely unusable
        console.warn('Storage unavailable');
      }
    }
  }, []);

  const { data: images = [], isLoading, isFetching } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/images"],
    staleTime: 30000,
    gcTime: 600000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Update cache when data changes (with error handling)
  useEffect(() => {
    if (images && images.length > 0) {
      try {
        // Limit cache size and clean old data
        const limitedImages = images.slice(0, 10); // Only cache 10 most recent
        localStorage.setItem('cached_images', JSON.stringify(limitedImages));
        setLocalImages(images);
      } catch (error) {
        // If localStorage is full, clear cache and try again
        console.warn('Cache storage full, clearing old data');
        try {
          localStorage.removeItem('cached_images');
          localStorage.removeItem('auth_token');
          // Try again with smaller dataset
          const smallImages = images.slice(0, 5);
          localStorage.setItem('cached_images', JSON.stringify(smallImages));
        } catch (e) {
          // If still fails, just use memory cache
          console.warn('Using memory cache only');
        }
        setLocalImages(images);
      }
    }
  }, [images]);

  // Return cached images immediately if loading, otherwise return fresh data
  const displayImages = (!isLoading && images.length > 0) ? images : localImages;

  const addImageToCache = (newImage: GeneratedImage) => {
    const updated = [newImage, ...localImages].slice(0, 10);
    setLocalImages(updated);
    
    try {
      localStorage.setItem('cached_images', JSON.stringify(updated));
    } catch (error) {
      // Storage full, clear and try with smaller dataset
      try {
        localStorage.clear();
        const minimal = updated.slice(0, 3);
        localStorage.setItem('cached_images', JSON.stringify(minimal));
      } catch (e) {
        // Just use memory cache
        console.warn('Using memory cache only');
      }
    }
    
    // Update query cache
    queryClient.setQueryData(["/api/images"], updated);
  };

  const refreshGallery = async () => {
    await queryClient.refetchQueries({ queryKey: ["/api/images"] });
  };

  return {
    images: displayImages,
    isLoading: isLoading && localImages.length === 0,
    isFetching,
    addImageToCache,
    refreshGallery,
  };
}