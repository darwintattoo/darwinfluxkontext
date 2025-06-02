import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Camera, Palette, Users, Zap, Eye, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Tips() {
  const { language, t } = useLanguage();

  const tips = [
    {
      id: 1,
      category: language === 'es' ? 'Cambio de Poses' : 'Pose Changes',
      icon: <Users className="h-5 w-5" />,
      title: language === 'es' ? 'Cómo Cambiar Poses de Rostros' : 'How to Change Face Poses',
      description: language === 'es' 
        ? 'Técnicas efectivas para modificar la posición y orientación del rostro'
        : 'Effective techniques to modify face position and orientation',
      content: language === 'es' ? [
        'Usa direcciones específicas: "Turn head slightly to the left", "Look over shoulder"',
        'Especifica ángulos: "45-degree angle", "three-quarter view", "profile view"',
        'Combina con expresiones: "Turn left while smiling", "Look down pensively"',
        'Mantén consistencia: Agrega "preserve original lighting" si solo quieres cambiar pose'
      ] : [
        'Use specific directions: "Turn head slightly to the left", "Look over shoulder"',
        'Specify angles: "45-degree angle", "three-quarter view", "profile view"',
        'Combine with expressions: "Turn left while smiling", "Look down pensively"',
        'Maintain consistency: Add "preserve original lighting" if you only want to change pose'
      ],
      examples: language === 'es' ? [
        '"Gira la cabeza ligeramente hacia la izquierda"',
        '"Vista de tres cuartos mirando hacia arriba"',
        '"Perfil completo con expresión seria"'
      ] : [
        '"Turn head slightly to the left"',
        '"Three-quarter view looking upward"',
        '"Full profile with serious expression"'
      ]
    },
    {
      id: 2,
      category: language === 'es' ? 'Iluminación' : 'Lighting',
      icon: <Lightbulb className="h-5 w-5" />,
      title: language === 'es' ? 'Técnicas de Iluminación Profesional' : 'Professional Lighting Techniques',
      description: language === 'es' 
        ? 'Configura iluminación como un fotógrafo profesional'
        : 'Set up lighting like a professional photographer',
      content: language === 'es' ? [
        'Rembrandt lighting: "key light 45° high right, dramatic shadows"',
        'Butterfly lighting: "key light directly above, soft shadows under nose"',
        'Split lighting: "hard side light, half face in shadow"',
        'Rim lighting: "backlight from behind, creates outline glow"'
      ] : [
        'Rembrandt lighting: "key light 45° high right, dramatic shadows"',
        'Butterfly lighting: "key light directly above, soft shadows under nose"',
        'Split lighting: "hard side light, half face in shadow"',
        'Rim lighting: "backlight from behind, creates outline glow"'
      ],
      examples: language === 'es' ? [
        '"Iluminación Rembrandt con luz clave 45° arriba derecha"',
        '"Luz suave de mariposa desde arriba"',
        '"Contraluz azul desde atrás izquierda"'
      ] : [
        '"Rembrandt lighting with key 45° high right"',
        '"Soft butterfly light from above"',
        '"Blue rim light from behind left"'
      ]
    },
    {
      id: 3,
      category: language === 'es' ? 'Estilos Artísticos' : 'Art Styles',
      icon: <Palette className="h-5 w-5" />,
      title: language === 'es' ? 'Transformaciones de Estilo' : 'Style Transformations',
      description: language === 'es' 
        ? 'Convierte tu imagen en diferentes estilos artísticos'
        : 'Transform your image into different artistic styles',
      content: language === 'es' ? [
        'Especifica el medio: "oil painting", "pencil sketch", "watercolor"',
        'Menciona la técnica: "crosshatching", "soft shading", "visible brushstrokes"',
        'Añade referencias artísticas: "Renaissance style", "Art Nouveau", "hyperrealistic"',
        'Combina estilos: "charcoal sketch with digital enhancement"'
      ] : [
        'Specify the medium: "oil painting", "pencil sketch", "watercolor"',
        'Mention technique: "crosshatching", "soft shading", "visible brushstrokes"',
        'Add artistic references: "Renaissance style", "Art Nouveau", "hyperrealistic"',
        'Combine styles: "charcoal sketch with digital enhancement"'
      ],
      examples: language === 'es' ? [
        '"Convertir a pintura al óleo con pinceladas visibles"',
        '"Dibujo a lápiz con sombreado detallado"',
        '"Estilo Art Nouveau con líneas orgánicas"'
      ] : [
        '"Convert to oil painting with visible brushstrokes"',
        '"Pencil drawing with detailed shading"',
        '"Art Nouveau style with organic lines"'
      ]
    },
    {
      id: 4,
      category: language === 'es' ? 'Expresiones' : 'Expressions',
      icon: <Eye className="h-5 w-5" />,
      title: language === 'es' ? 'Control de Expresiones Faciales' : 'Facial Expression Control',
      description: language === 'es' 
        ? 'Modifica emociones y expresiones de manera natural'
        : 'Modify emotions and expressions naturally',
      content: language === 'es' ? [
        'Sé específico con emociones: "gentle smile", "intense gaze", "contemplative look"',
        'Describe los ojos: "eyes looking directly at camera", "gazing upward", "closed eyes"',
        'Menciona micro-expresiones: "slight frown", "raised eyebrow", "subtle smirk"',
        'Combina con contexto: "confident expression for business portrait"'
      ] : [
        'Be specific with emotions: "gentle smile", "intense gaze", "contemplative look"',
        'Describe the eyes: "eyes looking directly at camera", "gazing upward", "closed eyes"',
        'Mention micro-expressions: "slight frown", "raised eyebrow", "subtle smirk"',
        'Combine with context: "confident expression for business portrait"'
      ],
      examples: language === 'es' ? [
        '"Sonrisa suave con ojos mirando a cámara"',
        '"Expresión pensativa con ceja ligeramente levantada"',
        '"Mirada intensa y confiada"'
      ] : [
        '"Gentle smile with eyes looking at camera"',
        '"Thoughtful expression with slightly raised eyebrow"',
        '"Intense and confident gaze"'
      ]
    },
    {
      id: 5,
      category: language === 'es' ? 'Mejores Prácticas' : 'Best Practices',
      icon: <Zap className="h-5 w-5" />,
      title: language === 'es' ? 'Consejos para Mejores Resultados' : 'Tips for Better Results',
      description: language === 'es' 
        ? 'Estrategias generales para obtener los mejores resultados'
        : 'General strategies to get the best results',
      content: language === 'es' ? [
        'Usa inglés: Los prompts en inglés generalmente producen mejores resultados',
        'Sé específico: "soft natural lighting" es mejor que solo "good lighting"',
        'Menciona lo que NO quieres cambiar: "preserve original background"',
        'Experimenta gradualmente: Haz un cambio a la vez para resultados predecibles',
        'Usa términos técnicos: "shallow depth of field", "bokeh effect", "color grading"'
      ] : [
        'Use English: English prompts generally produce better results',
        'Be specific: "soft natural lighting" is better than just "good lighting"',
        'Mention what NOT to change: "preserve original background"',
        'Experiment gradually: Make one change at a time for predictable results',
        'Use technical terms: "shallow depth of field", "bokeh effect", "color grading"'
      ],
      examples: language === 'es' ? [
        '"Soft natural lighting with shallow depth of field"',
        '"Preserve original pose and wardrobe"',
        '"Professional headshot with warm color grading"'
      ] : [
        '"Soft natural lighting with shallow depth of field"',
        '"Preserve original pose and wardrobe"',
        '"Professional headshot with warm color grading"'
      ]
    },
    {
      id: 6,
      category: language === 'es' ? 'Fotografía' : 'Photography',
      icon: <Camera className="h-5 w-5" />,
      title: language === 'es' ? 'Configuraciones de Cámara' : 'Camera Settings',
      description: language === 'es' 
        ? 'Simula diferentes configuraciones y efectos de cámara'
        : 'Simulate different camera settings and effects',
      content: language === 'es' ? [
        'Profundidad de campo: "shallow/deep depth of field", "bokeh background"',
        'Tipo de lente: "wide angle", "telephoto", "macro lens effect"',
        'Configuraciones: "low light photography", "high contrast", "soft focus"',
        'Efectos de post-procesado: "color grading", "film grain", "vintage look"'
      ] : [
        'Depth of field: "shallow/deep depth of field", "bokeh background"',
        'Lens type: "wide angle", "telephoto", "macro lens effect"',
        'Settings: "low light photography", "high contrast", "soft focus"',
        'Post-processing effects: "color grading", "film grain", "vintage look"'
      ],
      examples: language === 'es' ? [
        '"Efecto bokeh suave en el fondo"',
        '"Fotografía con poca luz y grano de película"',
        '"Lente gran angular con distorsión mínima"'
      ] : [
        '"Soft bokeh effect in background"',
        '"Low light photography with film grain"',
        '"Wide angle lens with minimal distortion"'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-slate-300 hover:text-slate-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Volver al Generador' : 'Back to Generator'}
            </Button>
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {language === 'es' ? 'Consejos y Técnicas' : 'Tips & Techniques'}
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            {language === 'es' 
              ? 'Aprende técnicas profesionales para obtener los mejores resultados en la edición de imágenes con IA'
              : 'Learn professional techniques to get the best results from AI image editing'
            }
          </p>
        </div>

        <div className="grid gap-8 md:gap-12">
          {tips.map((tip) => (
            <Card key={tip.id} className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {tip.icon}
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                      {tip.category}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-2xl text-slate-100">{tip.title}</CardTitle>
                <CardDescription className="text-slate-300 text-lg">
                  {tip.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-200 mb-3">
                    {language === 'es' ? 'Técnicas:' : 'Techniques:'}
                  </h4>
                  <ul className="space-y-2">
                    {tip.content.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-300">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-slate-200 mb-3">
                    {language === 'es' ? 'Ejemplos de Prompts:' : 'Example Prompts:'}
                  </h4>
                  <div className="space-y-2">
                    {tip.examples.map((example, index) => (
                      <div key={index} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                        <code className="text-green-300 font-mono text-sm">{example}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-blue-500/20 to-slate-600/20 border-blue-500/30">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                {language === 'es' ? '¿Necesitas Más Ayuda?' : 'Need More Help?'}
              </h3>
              <p className="text-slate-300 text-lg">
                {language === 'es' 
                  ? 'Experimenta con diferentes combinaciones y recuerda que la práctica hace al maestro. ¡Cada imagen es una oportunidad de aprender!'
                  : 'Experiment with different combinations and remember that practice makes perfect. Every image is an opportunity to learn!'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}