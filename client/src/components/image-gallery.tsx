import { useState } from "react";
import { Download, Share, Edit, Expand, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import OptimizedImage from "@/components/optimized-image";
import type { GeneratedImage } from "@shared/schema";

interface ImageGalleryProps {
  images: GeneratedImage[];
  isLoading: boolean;
  onImageSelect: (image: GeneratedImage) => void;
  onUseAsReference?: (imageUrl: string) => void;
  isGenerating?: boolean;
  isLoadingGeneratedImage?: boolean;
}

export default function ImageGallery({ images, isLoading, onImageSelect, onUseAsReference, isGenerating, isLoadingGeneratedImage }: ImageGalleryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Your image is being downloaded",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the image",
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
        // User cancelled sharing or sharing failed
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(image.imageUrl);
        toast({
          title: "Link copied",
          description: "Image URL copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Share failed",
          description: "Failed to copy link to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading && images.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
          <h3 className="text-lg font-medium text-slate-200 mb-2">Loading images...</h3>
          <p className="text-slate-400">Please wait while we fetch your generated images.</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <Edit className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-200 mb-2">No images yet</h3>
          <p className="text-slate-400">Generate your first image to see it here.</p>
        </div>
      </div>
    );
  }

  const latestImage = images[0];
  const previousImages = images.slice(1);

  return (
    <div className="space-y-6">


      {/* Image Loading State - Después de generar */}
      {isLoadingGeneratedImage && (
        <div className="bg-gradient-to-br from-green-500/30 via-green-600/30 to-emerald-600/30 backdrop-blur-sm rounded-2xl border-4 border-green-400/50 p-8 shadow-2xl shadow-green-500/30">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <svg className="w-20 h-20 transform -rotate-90 animate-spin" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-green-300/40"
                  strokeWidth="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-green-400"
                  strokeWidth="4"
                  strokeDasharray="60 40"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-200 mb-2 tracking-wide">
                CARGANDO IMAGEN FINAL
              </div>
              <div className="text-lg text-green-300 font-medium bg-black/30 px-4 py-2 rounded-full">
                Imagen generada exitosamente • Preparando visualización
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}

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
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Complete
                </span>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <OptimizedImage 
              src={latestImage.imageUrl}
              alt={latestImage.prompt}
              className="cursor-pointer transition-transform duration-300 group-hover:scale-105"
              onClick={() => onImageSelect(latestImage)}
            />
            
            {/* Image Actions Overlay */}
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
          </div>
          
          <div className="p-4 bg-slate-800/30">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <div className="flex items-center space-x-4">
                <span>{formatDate(latestImage.createdAt)}</span>
                <span>{latestImage.width}x{latestImage.height}</span>
              </div>
            </div>
            
            {/* Action buttons row */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 px-3 py-1.5 h-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(latestImage);
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 px-3 py-1.5 h-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(latestImage);
                  }}
                >
                  <Share className="h-3 w-3 mr-1" />
                  Share
                </Button>
                {onUseAsReference && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30 px-3 py-1.5 h-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUseAsReference(latestImage.imageUrl);
                      toast({
                        title: "Image loaded as reference",
                        description: "You can now edit this image with a new prompt",
                      });
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Use as Reference
                  </Button>
                )}
              </div>
              
              <Button
                size="sm"
                variant="outline"
                className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 px-3 py-1.5 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(latestImage.id);
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
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
                <OptimizedImage 
                  src={image.imageUrl}
                  alt={image.prompt}
                  className="cursor-pointer transition-transform duration-300 group-hover:scale-105"
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
                <div className="flex items-center justify-between text-xs text-slate-400 mt-2 mb-3">
                  <span>{formatDate(image.createdAt)}</span>
                  <span>{image.width}x{image.height}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 px-2 py-1 h-auto text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    {onUseAsReference && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30 px-2 py-1 h-auto text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUseAsReference(image.imageUrl);
                          toast({
                            title: "Image loaded as reference",
                            description: "You can now edit this image with a new prompt",
                          });
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 px-2 py-1 h-auto text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(image.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}