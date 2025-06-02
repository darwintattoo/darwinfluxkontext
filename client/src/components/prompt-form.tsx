import React, { useState } from "react";
import { ChevronDown, Wand2, Info, Upload, X, Image, Languages, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface PromptFormProps {
  referenceImageUrl?: string;
}

export default function PromptForm({ referenceImageUrl }: PromptFormProps) {
  const [prompt, setPrompt] = useState("Front view");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [imageSize, setImageSize] = useState("1024x1024");
  const { language } = useLanguage();
  const [aspectRatio, setAspectRatio] = useState("match_input_image");
  const [inputImageUrl, setInputImageUrl] = useState(referenceImageUrl || "");
  const [inputImageFile, setInputImageFile] = useState<File | null>(null);
  const [generationTimer, setGenerationTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [panelHeight, setPanelHeight] = useState(600); // Default height in pixels

  // Update inputImageUrl when referenceImageUrl changes
  React.useEffect(() => {
    if (referenceImageUrl) {
      setInputImageUrl(referenceImageUrl);
      setPrompt("Change the expression to a warm, genuine smile");
    }
  }, [referenceImageUrl]);
  const [promptCategory, setPromptCategory] = useState("face_poses");
  
  const promptSuggestions = {
    general: [
      "Convert to bold black and white tattoo stencil style",
      "Transform into traditional American tattoo design", 
      "Add tribal patterns and geometric elements",
      "Create realistic black and gray shading style",
      "Make it minimalist line art tattoo design"
    ],
    face_expressions: [
      "Change the expression to a warm, genuine smile with crinkled eyes",
      "Make the person look surprised with raised eyebrows and wide eyes",
      "Transform to a serious, contemplative expression with furrowed brow",
      "Add a mischievous, playful grin with slight wink",
      "Change to a peaceful, serene expression with soft closed eyes",
      "Make the eyes look tired and weary with slight bags underneath",
      "Add an expression of pure joy and hearty laughter",
      "Create a mysterious, enigmatic smile like Mona Lisa",
      "Show a shocked expression with mouth slightly open",
      "Add a confident, determined look with intense piercing eyes",
      "Create a dreamy, romantic expression with soft loving gaze",
      "Show concern with worried, anxious furrowed features",
      "Add a fierce, angry expression with clenched jaw",
      "Create a sad, melancholic look with downturned mouth"
    ],
    face_poses: [
      { icon: "⚪", text: "Front", prompt: "Front view looking directly at camera" },
      { icon: "◐", text: "Left turn", prompt: "Turn head slightly to the left" },
      { icon: "◑", text: "Right turn", prompt: "Turn head slightly to the right" },
      { icon: "◗", text: "Profile", prompt: "Show complete side profile" },
      { icon: "◔", text: "3/4 view", prompt: "Three-quarter angle view" },
      { icon: "◉", text: "Look up", prompt: "Look upward with hopeful gaze" },
      { icon: "◎", text: "Look down", prompt: "Look down contemplatively" },
      { icon: "◒", text: "Over shoulder", prompt: "Look over shoulder toward camera" },
      { icon: "◍", text: "Dramatic", prompt: "Create dramatic tilted angle" },
      { icon: "◕", text: "Chin on hand", prompt: "Chin resting on hand thoughtfully" },
      { icon: "◖", text: "Dreamy", prompt: "Look up and to side with dreamy gaze" },
      { icon: "◌", text: "Dynamic", prompt: "Dynamic asymmetrical pose" }
    ],
    camera_angles: [
      "Shot from above looking down at a bird's eye view angle",
      "Low angle shot looking up from below for dramatic effect",
      "Dutch angle tilt for dynamic, off-kilter composition",
      "Wide shot showing full body from head to toe",
      "Medium shot from waist up with natural framing",
      "Close-up shot focusing on face and upper shoulders",
      "Extreme close-up on eyes and facial features only",
      "Over-the-shoulder perspective view from behind",
      "Side angle shot in perfect profile silhouette",
      "Three-quarter angle between front and side view",
      "Straight-on frontal view directly facing camera",
      "High angle looking down slightly for flattering perspective",
      "Eye-level shot at natural human viewing height",
      "Worm's eye view from ground level looking up",
      "Aerial view from directly overhead looking down",
      "Candid angle capturing natural, unposed moment"
    ],
    style_changes: [
      "Convert to a detailed pencil sketch with fine shading",
      "Transform to hyperrealistic digital art with perfect details",
      "Apply Art Nouveau style with flowing organic lines and patterns",
      "Convert to charcoal drawing with dramatic contrast",
      "Transform to watercolor painting with soft flowing colors",
      "Apply Art Deco style with geometric patterns and golden accents",
      "Convert to oil painting with visible brushstrokes",
      "Transform to ink drawing with crosshatching technique",
      "Apply manga/anime art style with clean lines",
      "Convert to realistic portrait photography style",
      "Transform to impressionist painting with soft colors",
      "Apply minimalist line art style",
      "Convert to vintage engraving illustration style",
      "Transform to digital vector art with clean shapes",
      "A hyper-realistic Engraving 3D monochrome illustration",
      "Hyper-realistic 3D wood-engraving illustration"
    ],
    lighting: [
      "Apply Rembrandt lighting with key light 45° high right, dramatic shadows",
      "Soft butterfly lighting from directly above, gentle shadows under nose",
      "Hard split lighting from side, half face in shadow",
      "Blue rim light from behind left creating outline glow",
      "Golden hour warm lighting with soft natural glow",
      "Studio lighting with multiple sources for even illumination",
      "Dramatic low-key lighting with deep shadows",
      "High-key bright lighting with minimal shadows",
      "Natural window light from left side, soft and diffused",
      "Hard directional light creating strong contrast",
      "Backlighting with silhouette effect against bright background",
      "Color gel lighting with blue and orange tones",
      "Soft ring light for beauty portrait lighting",
      "Three-point lighting setup with key, fill, and rim lights"
    ],
    animals: [
      "Make the cat sit upright with perfect posture and alert ears",
      "Change the dog's expression to playful with tongue hanging out happily",
      "Position the bird with wings spread wide in majestic flight",
      "Make the horse rear up on hind legs dramatically against the sky",
      "Show the lion with a regal pose and flowing mane in golden light",
      "Position the elephant with trunk raised high triumphantly",
      "Make the tiger crouch low in a hunting stance with intense focus",
      "Show the wolf howling with head tilted back toward the full moon",
      "Position the eagle perched proudly with piercing, intense gaze",
      "Make the dolphin jump gracefully out of crystal clear blue water",
      "Show the bear standing tall on hind legs intimidatingly",
      "Position the deer grazing peacefully in a sunlit forest clearing",
      "Make the monkey swing playfully from branch to branch",
      "Show the snake coiled elegantly with head raised alertly",
      "Position the owl with head turned almost completely around"
    ]
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (data: { 
      prompt: string; 
      inputImageUrl?: string; 
      width?: number; 
      height?: number; 
      aspectRatio?: string; 
    }) => {
      // Start timer
      setGenerationTimer(0);
      const interval = setInterval(() => {
        setGenerationTimer(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);

      try {
        const response = await apiRequest("POST", "/api/generate", data);
        return response.json();
      } finally {
        // Stop timer
        clearInterval(interval);
        setTimerInterval(null);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image generated successfully!",
      });
      // Force immediate refresh of images
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      queryClient.refetchQueries({ queryKey: ["/api/images"] });
      setGenerationTimer(0);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate image. Please try again.",
        variant: "destructive",
      });
      setGenerationTimer(0);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    },
  });

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        
        try {
          // Upload to server to get a proper URL
          const response = await apiRequest("POST", "/api/upload", {
            imageData: result
          });
          
          const data = await response.json();
          
          if (data.imageUrl) {
            setInputImageUrl(data.imageUrl);
            setInputImageFile(file);
          } else {
            throw new Error("Failed to get image URL");
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      });
    }
  };

  // Function to detect if text is primarily in Spanish and translate to English
  const translateToEnglish = (text: string): string => {
    // First check for exact phrase matches
    const phraseTranslations: { [key: string]: string } = {
      "Vista frontal": "Front view",
      "Vista de perfil": "Profile view", 
      "Vista lateral": "Side view",
      "Vista de tres cuartos": "Three-quarter view",
      "Vista desde arriba": "Top view",
      "Vista desde abajo": "Bottom view",
      "Ángulo holandés": "Dutch angle",
      "Vista de pájaro": "Bird's eye view",
      "Mirada hacia arriba": "Looking up",
      "Mirada hacia abajo": "Looking down",
      "Sonrisa cálida": "Warm smile",
      "Expresión seria": "Serious expression",
      "Ojos cerrados": "Eyes closed",
      "Mirada pensativa": "Thoughtful gaze",
      "Risa genuina": "Genuine laugh",
      "Expresión melancólica": "Melancholic expression",
      "Cambiar la expresión": "Change the expression",
      "Inclinar la cabeza": "Tilt the head",
      "Mirar hacia arriba con esperanza": "Look upward with hopeful gaze",
      "Mirar hacia abajo pensativo": "Look downward thoughtfully",
      "Ángulo holandés para composición dinámica": "Dutch angle tilt for dynamic, off-kilter composition",
      "Toma desde arriba mirando hacia abajo": "Shot from above looking down"
    };

    // Check for exact phrase matches first
    for (const [spanish, english] of Object.entries(phraseTranslations)) {
      if (text.toLowerCase().includes(spanish.toLowerCase())) {
        return text.replace(new RegExp(spanish, 'gi'), english);
      }
    }

    // Common Spanish words and patterns
    const spanishWords = [
      'el', 'la', 'los', 'las', 'de', 'del', 'en', 'con', 'por', 'para', 'un', 'una', 'y', 'o',
      'que', 'se', 'es', 'son', 'está', 'están', 'tiene', 'tienen', 'hace', 'hacer',
      'cara', 'rostro', 'sonrisa', 'ojos', 'cabello', 'pelo', 'negro', 'blanco', 'gris',
      'tatuaje', 'diseño', 'estilo', 'tradicional', 'realista', 'tribal', 'minimalista',
      'agregar', 'agrega', 'cambiar', 'cambia', 'mostrar', 'muestra', 'crear', 'crea',
      'transformar', 'transforma', 'convertir', 'convierte', 'añadir', 'añade'
    ];

    // Word-by-word translation mappings
    const translations: { [key: string]: string } = {
      // Basic words
      'agregar': 'add',
      'agrega': 'add',
      'añadir': 'add',
      'añade': 'add',
      'cambiar': 'change',
      'cambia': 'change',
      'mostrar': 'show',
      'muestra': 'show',
      'crear': 'create',
      'crea': 'create',
      'transformar': 'transform',
      'transforma': 'transform',
      'convertir': 'convert',
      'convierte': 'convert',
      
      // Body parts and features
      'cara': 'face',
      'rostro': 'face',
      'ojos': 'eyes',
      'ojo': 'eye',
      'sonrisa': 'smile',
      'cabello': 'hair',
      'pelo': 'hair',
      'expresión': 'expression',
      'expresion': 'expression',
      
      // Colors
      'negro': 'black',
      'blanco': 'white',
      'gris': 'gray',
      'azul': 'blue',
      'rojo': 'red',
      'verde': 'green',
      
      // Tattoo styles
      'tatuaje': 'tattoo',
      'diseño': 'design',
      'estilo': 'style',
      'tradicional': 'traditional',
      'realista': 'realistic',
      'tribal': 'tribal',
      'minimalista': 'minimalist',
      
      // Animals
      'cuervo': 'raven',
      'cuervos': 'ravens',
      'águila': 'eagle',
      'lobo': 'wolf',
      'león': 'lion',
      'serpiente': 'snake',
      
      // Positions/directions
      'arriba': 'above',
      'abajo': 'below',
      'encima': 'on top',
      'debajo': 'underneath',
      'al lado': 'beside',
      'alrededor': 'around',
      
      // Conjunctions and prepositions
      'y': 'and',
      'con': 'with',
      'sin': 'without',
      'en': 'in',
      'sobre': 'on',
      'bajo': 'under',
      'entre': 'between',
      'hacia': 'towards',
      'desde': 'from',
      'hasta': 'until',
      'para': 'for',
      'por': 'by',
      'de': 'of',
      'del': 'of the',
      'un': 'a',
      'una': 'a',
      'el': 'the',
      'la': 'the',
      'los': 'the',
      'las': 'the'
    };

    // Check if the text contains Spanish words
    const words = text.toLowerCase().split(/\s+/);
    const spanishWordCount = words.filter(word => spanishWords.includes(word)).length;
    const isSpanish = spanishWordCount > words.length * 0.3; // If more than 30% are Spanish words

    if (!isSpanish) {
      return text; // Return original if not detected as Spanish
    }

    // Perform basic translation
    let translatedText = text.toLowerCase();
    
    // Replace whole words only
    Object.entries(translations).forEach(([spanish, english]) => {
      const regex = new RegExp(`\\b${spanish}\\b`, 'gi');
      translatedText = translatedText.replace(regex, english);
    });

    return translatedText;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    // Don't auto-translate anymore, user controls this with the translate button
    const finalPrompt = prompt.trim();

    const [width, height] = inputImageUrl ? [1024, 1024] : imageSize.split('x').map(Number);
    
    console.log("About to generate with:", {
      prompt: finalPrompt,
      inputImageUrl: inputImageUrl,
      hasInputImage: !!inputImageUrl,
      width,
      height,
      aspectRatio
    });
    
    generateMutation.mutate({ 
      prompt: finalPrompt, 
      inputImageUrl: inputImageUrl || undefined,
      width, 
      height,
      aspectRatio
    });
  };

  return (
    <div 
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 lg:sticky lg:top-24 overflow-auto"
      style={{ height: window.innerWidth >= 1024 ? `${panelHeight}px` : 'auto' }}
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-200">Generate Image</h2>
        <div className="text-xs text-slate-400 mt-1">
          {language === 'es' ? 'Impulsado por FLUX Kontext Max AI' : 'Powered by FLUX Kontext Max AI'}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Image Upload */}
        <div>
          <Label className="text-slate-300 mb-2">
            Reference Image (Optional)
          </Label>
          <div className="space-y-3">
            {inputImageUrl ? (
              <div className="relative">
                <img 
                  src={inputImageUrl} 
                  alt="Input reference" 
                  className="w-full h-auto max-h-48 object-contain rounded-lg border border-slate-600"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setInputImageUrl("");
                    setInputImageFile(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                <Image className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400 mb-3">
                  {language === 'es' 
                    ? 'Arrastra una imagen aquí o haz clic para subirla' 
                    : 'Drag an image here or click to upload'
                  }
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-slate-700 hover:bg-slate-600"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="prompt" className="text-slate-300">
              {inputImageUrl ? "What changes do you want to make?" : "Describe the image you want to generate"}
            </Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-600"
              onClick={() => {
                const translated = translateToEnglish(prompt);
                if (translated !== prompt) {
                  setPrompt(translated);
                  toast({
                    title: language === 'es' ? 'Texto traducido' : 'Text translated',
                    description: language === 'es' ? 'Prompt traducido al inglés' : 'Prompt translated to English',
                  });
                } else {
                  toast({
                    title: language === 'es' ? 'Sin cambios' : 'No changes',
                    description: language === 'es' ? 'El texto ya está en inglés' : 'Text is already in English',
                  });
                }
              }}
              title={language === 'es' ? 'Traducir a inglés' : 'Translate to English'}
            >
              <Languages className="h-3 w-3 mr-1" />
              {language === 'es' ? 'Traducir' : 'Translate'}
            </Button>
          </div>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            placeholder={inputImageUrl ? "Make the text 3D, floating in space on a city street" : "Describe the image you want to generate..."}
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            💡 {language === 'es' ? 'Recomendamos escribir en inglés para mejores resultados' : 'We recommend writing in English for better results'}
          </p>
        </div>

        {/* Advanced Parameters */}
        <div className="space-y-4">
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            <span>Advanced Settings</span>
            <ChevronDown className={`w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          
          {showAdvanced && (
            <div className="space-y-4">
              {!inputImageUrl && (
                <div>
                  <Label className="text-slate-300 mb-2">Image Size</Label>
                  <Select value={imageSize} onValueChange={setImageSize}>
                    <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                      <SelectItem value="1024x768">1024x768 (Landscape)</SelectItem>
                      <SelectItem value="768x1024">768x1024 (Portrait)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {inputImageUrl && (
                <div>
                  <Label className="text-slate-300 mb-2">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="match_input_image">Match Input Image</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      <SelectItem value="4:3">4:3 (Classic)</SelectItem>
                      <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                      <SelectItem value="3:2">3:2 (Photo)</SelectItem>
                      <SelectItem value="2:3">2:3 (Photo Portrait)</SelectItem>
                      <SelectItem value="4:5">4:5 (Instagram)</SelectItem>
                      <SelectItem value="5:4">5:4 (Instagram Landscape)</SelectItem>
                      <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                      <SelectItem value="9:21">9:21 (Ultrawide Portrait)</SelectItem>
                      <SelectItem value="2:1">2:1 (Panoramic)</SelectItem>
                      <SelectItem value="1:2">1:2 (Tall)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button 
          type="submit" 
          disabled={generateMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 transition-all duration-200"
        >
          <div className="flex items-center justify-center">
            {generateMutation.isPending ? (
              <div className="flex items-center space-x-3">
                {/* Circular Progress Indicator */}
                <div className="relative">
                  <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className="stroke-slate-400"
                      strokeWidth="2"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className="stroke-blue-400"
                      strokeWidth="2"
                      strokeDasharray={`${(generationTimer / 120) * 100} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {language === 'es' ? 'Generando...' : 'Generating...'}
                  </div>
                  <div className="text-xs text-blue-300 font-mono">
                    {Math.floor(generationTimer / 60)}:{String(generationTimer % 60).padStart(2, '0')} • {Math.round((generationTimer / 120) * 100)}%
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                {language === 'es' ? 'Generar Imagen' : 'Generate Image'}
              </>
            )}
          </div>
        </Button>



        {/* Image editing mode indicator */}
        {inputImageUrl && (
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center text-amber-400 mb-2">
              <Info className="inline mr-1 h-4 w-4" />
              <span className="text-sm font-medium">
                {language === 'es' ? 'Modo de edición de imagen activo' : 'Image editing mode active'}
              </span>
            </div>
            <div className="text-xs text-amber-300">
              {language === 'es' 
                ? 'Tu imagen de referencia se transformará según el prompt' 
                : 'Your reference image will be transformed according to the prompt'
              }
            </div>
          </div>
        )}
      </form>
      
      {/* Quick Prompts */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Quick Prompts</h3>
        
        <div className="space-y-4">
          {/* Category Buttons - Horizontal */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPromptCategory(promptCategory === 'face_poses' ? '' : 'face_poses')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                promptCategory === 'face_poses' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/30'
              }`}
            >
              🎭 Face Poses
            </button>
            
            <button
              type="button"
              onClick={() => setPromptCategory(promptCategory === 'face_expressions' ? '' : 'face_expressions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                promptCategory === 'face_expressions' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/30'
              }`}
            >
              😊 Expressions
            </button>
            
            <button
              type="button"
              onClick={() => setPromptCategory(promptCategory === 'camera_angles' ? '' : 'camera_angles')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                promptCategory === 'camera_angles' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/30'
              }`}
            >
              📷 Angles
            </button>
            
            <button
              type="button"
              onClick={() => setPromptCategory(promptCategory === 'style_changes' ? '' : 'style_changes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                promptCategory === 'style_changes' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/30'
              }`}
            >
              🎨 Artistic
            </button>
            
            <button
              type="button"
              onClick={() => setPromptCategory(promptCategory === 'lighting' ? '' : 'lighting')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                promptCategory === 'lighting' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/30'
              }`}
            >
              💡 Lighting
            </button>
            

          </div>

          {/* Selected Category Content */}
          {promptCategory === 'face_poses' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
              {promptSuggestions.face_poses.map((pose: any, index: number) => (
                <button
                  key={index}
                  type="button"
                  className="flex flex-col items-center p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 hover:text-slate-200 transition-colors"
                  onClick={() => setPrompt(pose.prompt)}
                  title={pose.prompt}
                >
                  <span className="text-lg mb-1">{pose.icon}</span>
                  <span className="text-center leading-tight">{pose.text}</span>
                </button>
              ))}
            </div>
          )}

          {promptCategory === 'face_expressions' && (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {promptSuggestions.face_expressions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 hover:text-slate-200 transition-colors whitespace-nowrap"
                  onClick={() => setPrompt(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {promptCategory === 'camera_angles' && (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {promptSuggestions.camera_angles.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 hover:text-slate-200 transition-colors whitespace-nowrap"
                  onClick={() => setPrompt(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {promptCategory === 'style_changes' && (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {promptSuggestions.style_changes.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 hover:text-slate-200 transition-colors whitespace-nowrap"
                  onClick={() => setPrompt(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {promptCategory === 'lighting' && (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {promptSuggestions.lighting.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 hover:text-slate-200 transition-colors whitespace-nowrap"
                  onClick={() => setPrompt(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {promptCategory === 'general' && (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {promptSuggestions.general.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 hover:text-slate-200 transition-colors whitespace-nowrap"
                  onClick={() => setPrompt(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      

    </div>
  );
}
