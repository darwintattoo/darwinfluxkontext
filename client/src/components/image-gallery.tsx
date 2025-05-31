import { Download, Share, Expand, Trash2, Loader2, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GeneratedImage } from "@shared/schema";

interface ImageGalleryProps {
  images: GeneratedImage[];
  isLoading: boolean;
  onImageSelect: (image: GeneratedImage) => void;
  onUseAsReference?: (imageUrl: string) => void;
}

export default function ImageGallery({ images, isLoading, onImageSelect, onUseAsReference }: ImageGalleryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/images/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `generated-image-${image.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Image download started",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (image: GeneratedImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Generated Image',
          text: image.prompt,
          url: image.imageUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(image.imageUrl);
        toast({
          title: "Success",
          description: "Image URL copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy URL",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8 text-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-200 mb-2">Loading images...</h3>
          <p className="text-slate-400">Please wait while we fetch your generated images</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700 border-dashed p-12 text-center">
        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Expand className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-300 mb-2">No images generated yet</h3>
        <p className="text-slate-400">Enter a prompt and click "Generate Image" to get started</p>
      </div>
    );
  }

  const [latestImage, ...previousImages] = images;

  return (
    <div className="space-y-6">
      {/* Latest Generation */}
      {latestImage && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-slate-200">Latest Generation</h3>
                <p className="text-sm text-slate-400 mt-1">{latestImage.prompt}</p>
                {latestImage.inputImageUrl && (
                  <div className="flex items-center mt-2">
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                      Image Edit
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {latestImage.inputImageUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCompareEnabled(!compareEnabled)}
                    className="text-slate-400 hover:text-slate-300"
                  >
                    {compareEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    Compare
                  </Button>
                )}
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Complete
                </span>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            {compareEnabled && latestImage.inputImageUrl ? (
              <div className="relative overflow-hidden bg-transparent">
                {/* After Image (Generated) - Base layer */}
                <img 
                  src={latestImage.imageUrl}
                  alt={latestImage.prompt}
                  className="w-full h-auto cursor-pointer block"
                  onClick={() => onImageSelect(latestImage)}
                  style={{ 
                    filter: 'none',
                    mixBlendMode: 'normal',
                    backgroundColor: 'transparent'
                  }}
                />
                
                {/* Before Image (Reference) - Overlay with clip */}
                <div 
                  className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
                  style={{ 
                    clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
                  }}
                >
                  <img 
                    src={latestImage.inputImageUrl}
                    alt="Reference image"
                    className="w-full h-auto"
                    style={{ 
                      objectFit: 'contain',
                      objectPosition: 'left top'
                    }}
                  />
                </div>
                
                {/* Labels */}
                <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 rounded text-sm font-medium z-20">
                  Before
                </div>
                <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1 rounded text-sm font-medium z-20">
                  After
                </div>
                
                {/* Slider */}
                <div 
                  className="absolute inset-y-0 z-20 w-1 bg-white shadow-lg cursor-ew-resize"
                  style={{ left: `${sliderPosition}%` }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    if (!rect) return;
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const x = moveEvent.clientX - rect.left;
                      const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100));
                      setSliderPosition(newPosition);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-gray-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            ) : (
              <img 
                src={latestImage.imageUrl}
                alt={latestImage.prompt}
                className="w-full h-auto cursor-pointer transition-transform duration-300 group-hover:scale-105"
                onClick={() => onImageSelect(latestImage)}
              />
            )}
            
            {/* Image Actions Overlay */}
            {!compareEnabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(latestImage);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(latestImage);
                    }}
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                  {onUseAsReference && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-amber-500/30 backdrop-blur-sm text-white hover:bg-amber-500/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUseAsReference(latestImage.imageUrl);
                        toast({
                          title: "Image loaded as reference",
                          description: "You can now edit this image with a new prompt",
                        });
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageSelect(latestImage);
                    }}
                  >
                    <Expand className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-800/30">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-4">
                <span>{formatDate(latestImage.createdAt)}</span>
                <span>{latestImage.width}x{latestImage.height}</span>
                <span>${latestImage.cost || "0.08"}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-red-400 transition-colors h-auto p-1"
                onClick={() => deleteMutation.mutate(latestImage.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Generations */}
      {previousImages.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {previousImages.map((image) => (
            <div key={image.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden group">
              <div className="relative">
                <img 
                  src={image.imageUrl}
                  alt={image.prompt}
                  className="w-full h-auto cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  onClick={() => onImageSelect(image)}
                />
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 text-sm p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    {onUseAsReference && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-amber-500/30 backdrop-blur-sm text-white hover:bg-amber-500/50 text-sm p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUseAsReference(image.imageUrl);
                          toast({
                            title: "Image loaded as reference",
                            description: "You can now edit this image with a new prompt",
                          });
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 text-sm p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageSelect(image);
                      }}
                    >
                      <Expand className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-3">
                <p className="text-sm text-slate-300 truncate">{image.prompt}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                  <span>{formatDate(image.createdAt)}</span>
                  <span>{image.width}x{image.height}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
