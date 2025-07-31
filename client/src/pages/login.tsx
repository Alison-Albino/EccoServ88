import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Droplet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { type LoginRequest } from "@shared/schema";

export default function Login() {
  const [credentials, setCredentials] = useState<LoginRequest>({
    email: "",
    password: "",
    userType: "client" as const,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(credentials);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao EccoServ",
      });
    } catch (error) {
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
              <Droplet className="text-white text-2xl h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">EccoServ</h1>
            <p className="text-gray-600 mt-2">Gestão de Poços Artesianos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="userType">Tipo de Usuário</Label>
              <Select
                value={credentials.userType}
                onValueChange={(value: "client" | "provider" | "admin") =>
                  setCredentials({ ...credentials, userType: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="provider">Prestador de Serviço</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium">
              Esqueceu sua senha?
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
