import { useState } from "react";
import { ChevronDown, Wand2, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PromptForm() {
  const [prompt, setPrompt] = useState("A majestic mountain landscape at sunset with golden light reflecting on a pristine lake");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [imageSize, setImageSize] = useState("1024x1024");
  const [quality, setQuality] = useState([80]);
  const [recentPrompts] = useState([
    "A serene forest path with dappled sunlight...",
    "Modern cityscape at night with neon lights...",
    "Abstract digital art with flowing colors..."
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string; width: number; height: number }) => {
      const response = await apiRequest("POST", "/api/generate", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image generated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    },
  });

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

    const [width, height] = imageSize.split('x').map(Number);
    generateMutation.mutate({ prompt: prompt.trim(), width, height });
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 sticky top-24">
      <h2 className="text-lg font-semibold mb-4 text-slate-200">Generate Image</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="prompt" className="text-slate-300 mb-2">
            Prompt
          </Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            placeholder="Describe the image you want to generate..."
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

              <div>
                <Label className="text-slate-300 mb-2">
                  Quality <span className="text-slate-500">{quality[0]}</span>
                </Label>
                <Slider
                  value={quality}
                  onValueChange={setQuality}
                  min={50}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button 
          type="submit" 
          disabled={generateMutation.isPending}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 transition-all duration-200"
        >
          <div className="flex items-center justify-center">
            <Wand2 className="mr-2 h-4 w-4" />
            {generateMutation.isPending ? 'Generating...' : 'Generate Image'}
          </div>
        </Button>

        {/* Cost Estimate */}
        <div className="text-xs text-slate-400 text-center">
          <Info className="inline mr-1 h-3 w-3" />
          Estimated cost: <span className="text-slate-300">$0.05</span> per generation
        </div>
      </form>
      
      {/* Recent Prompts */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Recent Prompts</h3>
        <div className="space-y-2">
          {recentPrompts.map((recentPrompt, index) => (
            <button
              key={index}
              onClick={() => setPrompt(recentPrompt)}
              className="w-full text-left px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-xs text-slate-400 hover:text-slate-300 transition-colors truncate"
            >
              {recentPrompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
