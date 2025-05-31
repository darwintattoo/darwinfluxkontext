import { useState } from "react";
import { Wand2, Settings, Circle, Globe } from "lucide-react";
import PromptForm from "@/components/prompt-form";
import ImageGallery from "@/components/image-gallery";
import ImageModal from "@/components/image-modal";
import SettingsModal from "@/components/settings-modal";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
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
  const { language, setLanguage, t } = useLanguage();

  const { data: images = [], isLoading, isFetching } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/images"],
    refetchInterval: 2000, // Auto-refresh every 2 seconds when generating
  });

  const hasApiKey = !!localStorage.getItem("replicate_api_token");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
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
                <div className="text-xs text-slate-500">Created by Darwin Enriquez</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
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

              {/* Settings Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="text-slate-300 hover:text-slate-100"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <PromptForm referenceImageUrl={referenceImageUrl} />
          </div>

          {/* Gallery */}
          <div className="lg:col-span-2">
            {isFetching && !isLoading && (
              <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm text-center">
                {language === 'es' ? 'Actualizando galería...' : 'Updating gallery...'}
              </div>
            )}
            <ImageGallery 
              images={images} 
              isLoading={isLoading}
              onImageSelect={setSelectedImage}
              onUseAsReference={setReferenceImageUrl}
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
