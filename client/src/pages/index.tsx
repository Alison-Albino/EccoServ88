import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, Shield, Users, CheckCircle, ArrowRight } from "lucide-react";

export default function IndexPage() {
  const [, navigate] = useLocation();

  const features = [
    {
      icon: Droplet,
      title: "Gestão de Poços",
      description: "Monitore e gerencie todos os seus poços artesianos em um só lugar"
    },
    {
      icon: Users,
      title: "Prestadores Qualificados",
      description: "Conecte-se com técnicos especializados em manutenção de poços"
    },
    {
      icon: Shield,
      title: "Controle Total",
      description: "Acompanhe visitas, relatórios e faturas com total transparência"
    },
    {
      icon: CheckCircle,
      title: "Faturamento Integrado",
      description: "Sistema completo de geração e controle de faturas"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Droplet className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gray-900">EccoServ</span>
          </div>
          <div className="flex space-x-4">
            <Link href="/login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Cadastrar-se</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Gestão Profissional de
            <span className="text-primary block">Poços Artesianos</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Conectamos proprietários de poços com prestadores de serviço especializados, 
            oferecendo uma plataforma completa para agendamento, acompanhamento e faturamento de serviços.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register">
              <Button size="lg" className="flex items-center space-x-2">
                <span>Começar Agora</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Fazer Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-primary">Para Clientes</CardTitle>
              <CardDescription>Proprietários de poços artesianos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Agende manutenções facilmente</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Acompanhe o histórico de serviços</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Receba faturas organizadas</span>
              </div>
              <Link href="/register?type=client" className="block pt-4">
                <Button className="w-full">Cadastrar como Cliente</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-success">Para Prestadores</CardTitle>
              <CardDescription>Técnicos especializados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Gerencie seus atendimentos</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Registre visitas com fotos</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Gere faturas automaticamente</span>
              </div>
              <div className="pt-4 text-center">
                <p className="text-sm text-gray-600 mb-3">Cadastro realizado pelo administrador</p>
                <Link href="/login">
                  <Button className="w-full" variant="outline">Fazer Login</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-warning">Para Administradores</CardTitle>
              <CardDescription>Gestão completa da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Visão geral do sistema</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Relatórios financeiros</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Gerenciamento de usuários</span>
              </div>
              <Link href="/login" className="block pt-4">
                <Button className="w-full" variant="outline">Acesso Restrito</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 py-8 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Droplet className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-gray-900">EccoServ</span>
          </div>
          <p className="text-gray-600">
            Sistema completo de gerenciamento de manutenção de poços artesianos
          </p>
        </footer>
      </main>
    </div>
  );
}