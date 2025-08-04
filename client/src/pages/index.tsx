import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  Wrench, 
  Shield, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle,
  Users,
  Award,
  Zap,
  ArrowRight,
  Star
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const services = [
    {
      icon: Wrench,
      title: "Manutenção Preventiva",
      description: "Inspeções regulares para garantir o funcionamento ideal do seu poço",
      features: ["Análise de qualidade da água", "Verificação de equipamentos", "Relatório técnico completo"]
    },
    {
      icon: Droplets,
      title: "Limpeza de Poços",
      description: "Limpeza profissional para manter a pureza e qualidade da água",
      features: ["Remoção de sedimentos", "Desinfecção completa", "Testes de qualidade"]
    },
    {
      icon: Shield,
      title: "Manutenção Corretiva",
      description: "Reparo rápido e eficiente para problemas em seu sistema",
      features: ["Diagnóstico preciso", "Peças originais", "Garantia de serviço"]
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      location: "São Paulo, SP",
      text: "Excelente atendimento! Meu poço nunca funcionou tão bem. Equipe muito profissional.",
      rating: 5
    },
    {
      name: "João Santos",
      location: "Campinas, SP",
      text: "Serviço de qualidade com preço justo. Recomendo para todos que precisam de manutenção.",
      rating: 5
    },
    {
      name: "Ana Costa",
      location: "Ribeirão Preto, SP",
      text: "Muito satisfeita com o resultado. Água cristalina e sistema funcionando perfeitamente.",
      rating: 5
    }
  ];

  const stats = [
    { icon: Users, number: "500+", label: "Clientes Satisfeitos" },
    { icon: Wrench, number: "1200+", label: "Serviços Realizados" },
    { icon: Award, number: "15+", label: "Anos de Experiência" },
    { icon: Zap, number: "24h", label: "Atendimento de Emergência" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header/Navbar */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Droplets className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">EccoServ</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Entrar
                </Button>
              </Link>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Solicitar Orçamento
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  Especialistas em Poços Artesianos
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Água Pura e 
                  <span className="text-blue-600"> Segura</span> 
                  para sua Casa
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Manutenção profissional de poços artesianos com mais de 15 anos de experiência. 
                  Garantimos qualidade, segurança e água cristalina para sua família.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
                  Solicitar Orçamento Gratuito
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8">
                  <Phone className="mr-2 h-5 w-5" />
                  (11) 9999-9999
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-600 text-sm">Atendimento 24h</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-600 text-sm">Garantia Total</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-600 text-sm">Orçamento Grátis</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Solicite seu Orçamento</h3>
                <p className="mb-6">Preencha seus dados e receba uma proposta personalizada em até 24 horas.</p>
                
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Seu nome completo"
                    className="w-full p-3 rounded-lg text-gray-900 border-0 focus:ring-2 focus:ring-white/50"
                  />
                  <input 
                    type="tel" 
                    placeholder="Telefone com WhatsApp"
                    className="w-full p-3 rounded-lg text-gray-900 border-0 focus:ring-2 focus:ring-white/50"
                  />
                  <input 
                    type="text" 
                    placeholder="Cidade e bairro"
                    className="w-full p-3 rounded-lg text-gray-900 border-0 focus:ring-2 focus:ring-white/50"
                  />
                  <select className="w-full p-3 rounded-lg text-gray-900 border-0 focus:ring-2 focus:ring-white/50">
                    <option>Tipo de serviço necessário</option>
                    <option>Manutenção Preventiva</option>
                    <option>Limpeza de Poço</option>
                    <option>Manutenção Corretiva</option>
                    <option>Instalação Nova</option>
                    <option>Inspeção Técnica</option>
                  </select>
                  <Button className="w-full bg-white text-blue-600 hover:bg-gray-50 hover:text-blue-700 font-semibold">
                    Solicitar Orçamento Gratuito
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Nossos Serviços Especializados
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Oferecemos soluções completas para manutenção e cuidado do seu poço artesiano
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <service.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white">
                    Solicitar Orçamento
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-gray-600">
              Experiências reais de quem confia na EccoServ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Pronto para ter água pura e segura?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Entre em contato conosco hoje mesmo e solicite seu orçamento gratuito
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 hover:text-blue-700 text-lg px-8">
              <Phone className="mr-2 h-5 w-5" />
              Ligar Agora: (11) 9999-9999
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8">
              <Mail className="mr-2 h-5 w-5" />
              Solicitar Orçamento
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Droplets className="h-8 w-8 text-blue-400" />
                <h3 className="text-xl font-bold">EccoServ</h3>
              </div>
              <p className="text-gray-400">
                Especialistas em manutenção de poços artesianos há mais de 15 anos.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Serviços</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Manutenção Preventiva</li>
                <li>Limpeza de Poços</li>
                <li>Manutenção Corretiva</li>
                <li>Instalação</li>
                <li>Inspeção Técnica</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>(11) 9999-9999</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>contato@eccoserv.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>São Paulo, SP</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Horário</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Segunda - Sexta: 8h às 18h</li>
                <li>Sábado: 8h às 12h</li>
                <li>Emergências: 24h</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 EccoServ. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}