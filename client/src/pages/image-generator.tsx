import { useState } from "react";
import { Wand2, Settings, Circle } from "lucide-react";
import PromptForm from "@/components/prompt-form";
import ImageGallery from "@/components/image-gallery";
import ImageModal from "@/components/image-modal";
import SettingsModal from "@/components/settings-modal";
import { useQuery } from "@tanstack/react-query";
import type { GeneratedImage } from "@shared/schema";

export default function ImageGenerator() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>("");

  const { data: images = [], isLoading } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/images"],
  });

  const hasApiKey = !!localStorage.getItem("replicate_api_token");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-black rounded-lg flex items-center justify-center">
                <Wand2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Created by Darwin Enriquez</div>
                <h1 className="text-xl font-bold text-slate-50">TattooStencilPro</h1>
                <p className="text-xs font-semibold text-indigo-400">Powered by FLUX Kontext Max</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Circle className={`w-2 h-2 rounded-full ${hasApiKey ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'} animate-pulse`} />
                <span className="text-sm text-slate-400">
                  {hasApiKey ? 'API Connected' : 'API Key Required'}
                </span>
              </div>
              
              <button 
                onClick={() => setShowSettings(true)}
                className="text-slate-400 hover:text-slate-300 transition-colors p-2"
              >
                <Settings className="h-4 w-4" />
              </button>
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
