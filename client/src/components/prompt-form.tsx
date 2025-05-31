import React, { useState } from "react";
import { ChevronDown, Wand2, Info, Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PromptFormProps {
  referenceImageUrl?: string;
}

export default function PromptForm({ referenceImageUrl }: PromptFormProps) {
  const [prompt, setPrompt] = useState("Front view");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [imageSize, setImageSize] = useState("1024x1024");
  const [aspectRatio, setAspectRatio] = useState("match_input_image");
  const [inputImageUrl, setInputImageUrl] = useState(referenceImageUrl || "");
  const [inputImageFile, setInputImageFile] = useState<File | null>(null);
  const [generationTimer, setGenerationTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

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
      { icon: "●", text: "Front", prompt: "Front view looking directly at camera" },
      { icon: "◐", text: "Left turn", prompt: "Turn head slightly to the left" },
      { icon: "◑", text: "Right turn", prompt: "Turn head slightly to the right" },
      { icon: "◗", text: "Profile", prompt: "Show complete side profile" },
      { icon: "◔", text: "3/4 view", prompt: "Three-quarter angle view" },
      { icon: "▲", text: "Look up", prompt: "Look upward with hopeful gaze" },
      { icon: "▼", text: "Look down", prompt: "Look down contemplatively" },
      { icon: "◀", text: "Over shoulder", prompt: "Look over shoulder toward camera" },
      { icon: "◆", text: "Dramatic", prompt: "Create dramatic tilted angle" },
      { icon: "⬟", text: "Chin on hand", prompt: "Chin resting on hand thoughtfully" },
      { icon: "✧", text: "Dreamy", prompt: "Look up and to side with dreamy gaze" },
      { icon: "⬢", text: "Dynamic", prompt: "Dynamic asymmetrical pose" }
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
      "Transform to a vintage, sepia-toned photograph from the 1920s",
      "Convert to an oil painting in Renaissance style with rich colors",
      "Apply cyberpunk neon lighting effects with blue and pink tones",
      "Change to black and white film noir style with dramatic shadows",
      "Transform into an impressionist painting with visible brushstrokes",
      "Add art deco styling and geometric patterns in gold",
      "Convert to a detailed pencil sketch or charcoal drawing",
      "Apply pop art style with bright, contrasting colors",
      "Transform to hyperrealistic digital art style",
      "Add baroque painting style with dramatic chiaroscuro lighting"
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

    const [width, height] = inputImageUrl ? [1024, 1024] : imageSize.split('x').map(Number);
    
    generateMutation.mutate({ 
      prompt: prompt.trim(), 
      inputImageUrl: inputImageUrl || undefined,
      width, 
      height,
      aspectRatio
    });
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 sticky top-24">
      <h2 className="text-lg font-semibold mb-4 text-slate-200">Generate Image</h2>
      
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
                  Upload an image to edit or transform
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
          <Label htmlFor="prompt" className="text-slate-300 mb-2">
            {inputImageUrl ? "What changes do you want to make?" : "Describe the image you want to generate"}
          </Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            placeholder={inputImageUrl ? "Make the text 3D, floating in space on a city street" : "Describe the image you want to generate..."}
            required
          />
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
            <Wand2 className="mr-2 h-4 w-4" />
            {generateMutation.isPending ? (
              <div className="flex items-center">
                <span>Generating...</span>
                <span className="ml-2 text-indigo-200 font-mono">
                  {Math.floor(generationTimer / 60)}:{String(generationTimer % 60).padStart(2, '0')}
                </span>
              </div>
            ) : 'Generate Image'}
          </div>
        </Button>

        {/* Image editing mode indicator */}
        {inputImageUrl && (
          <div className="text-xs text-amber-400 text-center">
            <Info className="inline mr-1 h-3 w-3" />
            Image editing mode - transforming reference image
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
              onClick={() => setPromptCategory(promptCategory === 'general' ? '' : 'general')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                promptCategory === 'general' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/30'
              }`}
            >
              🖤 Tattoo
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
