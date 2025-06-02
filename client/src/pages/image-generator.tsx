import { useState, useCallback } from "react";
import { Wand2, Settings, Circle, Globe, Upload, BookOpen } from "lucide-react";
import { Link } from "wouter";
import PromptForm from "@/components/prompt-form";
import ImageGallery from "@/components/image-gallery";
import ImageModal from "@/components/image-modal";
import SettingsModal from "@/components/settings-modal";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GeneratedImage } from "@shared/schema";

export default function ImageGenerator() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();

  const { data: images = [], isLoading, isFetching } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/images"],
    refetchInterval: 2000, // Auto-refresh every 2 seconds when generating
  });

  const hasApiKey = !!localStorage.getItem("replicate_api_token");

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' ? 'Por favor selecciona un archivo de imagen válido' : 'Please select a valid image file',
        variant: "destructive",
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          
          const response = await apiRequest("POST", "/api/upload", {
            imageData: base64Data,
          });
          
          if (response.ok) {
            const result = await response.json();
            setReferenceImageUrl(result.imageUrl);
            toast({
              title: language === 'es' ? 'Imagen cargada' : 'Image uploaded',
              description: language === 'es' ? 'Ahora puedes usarla como referencia' : 'You can now use it as reference',
            });
          } else {
            throw new Error("Failed to get image URL");
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: language === 'es' ? 'Error' : 'Error',
            description: language === 'es' ? 'Error al subir imagen' : 'Failed to upload image',
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' ? 'Error al procesar imagen' : 'Failed to process image',
        variant: "destructive",
      });
    }
  }, [language, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  return (
    <div 
      className="min-h-screen bg-slate-900 text-slate-50 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800/90 border-2 border-dashed border-blue-400 rounded-xl p-8 text-center">
            <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <div className="text-xl font-semibold text-blue-400 mb-2">
              {language === 'es' ? 'Suelta la imagen aquí' : 'Drop image here'}
            </div>
            <div className="text-slate-300">
              {language === 'es' ? 'Para usar como imagen de referencia' : 'To use as reference image'}
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/attached_assets/1Asset 3zzz.png" 
                alt="TattooStencilPro Logo" 
                className="h-8 w-auto"
              />
              <div>
                <div className="text-sm font-medium text-slate-200 mb-1">{t('subtitle')}</div>
                <div className="text-xs text-slate-300">Created by Darwin Enriquez</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Admin Button */}
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-slate-100">
                  <Settings className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Admin' : 'Admin'}
                </Button>
              </Link>

              {/* Tips Button */}
              <Link href="/tips">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-slate-100">
                  <BookOpen className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Consejos' : 'Tips'}
                </Button>
              </Link>

              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-slate-100">
                    <Globe className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'ES' : 'EN'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem 
                    onClick={() => setLanguage('es')}
                    className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700"
                  >
                    {t('spanish')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLanguage('en')}
                    className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700"
                  >
                    {t('english')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>


            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Layout */}
        <div className="block lg:hidden space-y-6">
          {/* Form Section - Non-sticky on mobile */}
          <div className="w-full">
            <PromptForm referenceImageUrl={referenceImageUrl} />
          </div>
          
          {/* Gallery Section */}
          <div className="w-full">
            <ImageGallery 
              images={images} 
              isLoading={isLoading}
              onImageSelect={setSelectedImage}
              onUseAsReference={setReferenceImageUrl}
            />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <PromptForm 
              referenceImageUrl={referenceImageUrl} 
              onGenerationStart={() => setIsGenerating(true)}
              onGenerationEnd={() => setIsGenerating(false)}
            />
          </div>

          {/* Gallery */}
          <div className="lg:col-span-2">
            <ImageGallery 
              images={images} 
              isLoading={isLoading}
              onImageSelect={setSelectedImage}
              onUseAsReference={setReferenceImageUrl}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <ImageModal 
        image={selectedImage}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
      
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
