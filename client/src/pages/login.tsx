import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { login, isLoginPending, loginError } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' ? 'Por favor ingresa usuario y contraseña' : 'Please enter username and password',
        variant: "destructive",
      });
      return;
    }

    login({ username: username.trim(), password }, {
      onSuccess: () => {
        // Always redirect to home page after successful login
        setLocation("/");
      },
      onError: (error: any) => {
        toast({
          title: language === 'es' ? 'Error de autenticación' : 'Authentication Error',
          description: error.message || (language === 'es' ? 'Credenciales inválidas' : 'Invalid credentials'),
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/95 border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-100">
            TattooStencilPro
          </CardTitle>
          <CardDescription className="text-slate-400">
            {language === 'es' 
              ? 'Inicia sesión para acceder al generador' 
              : 'Sign in to access the generator'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">
                {language === 'es' ? 'Usuario' : 'Username'}
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400"
                placeholder={language === 'es' ? 'Ingresa tu usuario' : 'Enter your username'}
                disabled={isLoginPending}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                {language === 'es' ? 'Contraseña' : 'Password'}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400"
                placeholder={language === 'es' ? 'Ingresa tu contraseña' : 'Enter your password'}
                disabled={isLoginPending}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
              disabled={isLoginPending}
            >
              {isLoginPending 
                ? (language === 'es' ? 'Iniciando sesión...' : 'Signing in...') 
                : (language === 'es' ? 'Iniciar Sesión' : 'Sign In')
              }
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
            <p className="text-xs text-blue-200 font-medium mb-2">
              {language === 'es' ? 'Acceso de prueba:' : 'Test access:'}
            </p>
            <p className="text-xs text-blue-300">
              {language === 'es' 
                ? 'Contacta al administrador para obtener credenciales de acceso'
                : 'Contact the administrator to get access credentials'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}