import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function Admin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { language } = useLanguage();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      return apiRequest("POST", "/api/admin/create-user", { username, password });
    },
    onSuccess: () => {
      toast({
        title: language === 'es' ? 'Usuario creado' : 'User created',
        description: language === 'es' ? 'El usuario se ha creado exitosamente' : 'User has been created successfully',
      });
      setUsername("");
      setPassword("");
    },
    onError: (error: any) => {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: error.message || (language === 'es' ? 'Error al crear usuario' : 'Error creating user'),
        variant: "destructive",
      });
    }
  });

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

    createUserMutation.mutate({ username: username.trim(), password });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">
            {language === 'es' ? 'Panel de Administración' : 'Administration Panel'}
          </h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {language === 'es' ? 'Cerrar Sesión' : 'Logout'}
          </Button>
        </div>

        <Card className="bg-slate-800/95 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">
              {language === 'es' ? 'Crear Usuario de Prueba' : 'Create Test User'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {language === 'es' 
                ? 'Crea usuarios para compartir acceso a la aplicación'
                : 'Create users to share access to the application'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-username" className="text-slate-300">
                  {language === 'es' ? 'Nombre de Usuario' : 'Username'}
                </Label>
                <Input
                  id="new-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400"
                  placeholder={language === 'es' ? 'ej: tester01' : 'e.g: tester01'}
                  disabled={createUserMutation.isPending}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-300">
                  {language === 'es' ? 'Contraseña' : 'Password'}
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400"
                  placeholder={language === 'es' ? 'Contraseña segura' : 'Secure password'}
                  disabled={createUserMutation.isPending}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending 
                  ? (language === 'es' ? 'Creando...' : 'Creating...') 
                  : (language === 'es' ? 'Crear Usuario' : 'Create User')
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="pt-6">
            <h3 className="text-blue-200 font-medium mb-2">
              {language === 'es' ? 'Información de Seguridad' : 'Security Information'}
            </h3>
            <div className="text-sm text-blue-300 space-y-1">
              <p>
                {language === 'es'
                  ? '• Solo los administradores pueden crear nuevos usuarios'
                  : '• Only administrators can create new users'
                }
              </p>
              <p>
                {language === 'es'
                  ? '• Comparte las credenciales de forma segura con los testers'
                  : '• Share credentials securely with testers'
                }
              </p>
              <p>
                {language === 'es'
                  ? '• Las sesiones expiran automáticamente por seguridad'
                  : '• Sessions expire automatically for security'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}