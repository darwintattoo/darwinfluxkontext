import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { GeneratedImage } from "@shared/schema";

export function useFastGallery() {
  const queryClient = useQueryClient();
  const [localImages, setLocalImages] = useState<GeneratedImage[]>([]);

  // Load from localStorage on mount for instant display
  useEffect(() => {
    const cached = localStorage.getItem('cached_images');
    if (cached) {
      try {
        const images = JSON.parse(cached);
        setLocalImages(images);
      } catch (e) {
        // Invalid cache, ignore
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

  // Update cache when data changes
  useEffect(() => {
    if (images && images.length > 0) {
      localStorage.setItem('cached_images', JSON.stringify(images));
      setLocalImages(images);
    }
  }, [images]);

  // Return cached images immediately if loading, otherwise return fresh data
  const displayImages = (!isLoading && images.length > 0) ? images : localImages;

  const addImageToCache = (newImage: GeneratedImage) => {
    const updated = [newImage, ...localImages].slice(0, 15);
    setLocalImages(updated);
    localStorage.setItem('cached_images', JSON.stringify(updated));
    
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