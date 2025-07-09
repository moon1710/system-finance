import Link from "next/link"
import background from './bg.png'; // <-- Esto se queda igual
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, TrendingUp, CreditCard, Settings, Play, CheckCircle } from "lucide-react"


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed" // <-- CAMBIO AQUÍ
          style={{
            backgroundImage: `url(${background.src})`,
          }}
        />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <p className="text-sm text-gray-600 mb-8 font-medium">creator's wallet</p>
          <h1 className="text-5xl md:text-7xl font-bold text-black mb-6 leading-tight">
            El control de tus pagos, simplificado.
          </h1>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            La plataforma exclusiva para artistas donde gestionas tus finanzas y retiras tus ganancias con total
            transparencia y seguridad.
          </p>
          <Link href="/login">
            <Button className="bg-black hover:bg-gray-900 text-white px-10 py-10 rounded-full text-xl font-medium transition-all duration-300 hover:scale-105">
              Acceder a mi Cuenta
            </Button>
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Una plataforma en la que puedes confiar
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Tus fondos y datos, siempre seguros</h3>
                <p className="text-gray-600 leading-relaxed">
                  Utilizamos encriptación de extremo a extremo y las mejores prácticas de seguridad para garantizar que
                  tu información financiera esté protegida en todo momento.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Visibilidad total de tus finanzas</h3>
                <p className="text-gray-600 leading-relaxed">
                  Accede a un historial detallado de tus ganancias, consulta tu saldo en tiempo real y revisa el estado
                  de cada una de tus solicitudes de retiro sin sorpresas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Retira tu dinero como prefieras</h3>
                <p className="text-gray-600 leading-relaxed">
                  Ofrecemos múltiples métodos de pago, incluyendo transferencia bancaria nacional, internacional y
                  PayPal, para que recibas tu dinero donde más te convenga.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Empezar es muy fácil</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Settings className="w-10 h-10 text-white" />
              </div>
              <div className="w-1 h-12 bg-gradient-to-b from-blue-500 to-purple-600 mx-auto mb-6 md:hidden"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Configura</h3>
              <p className="text-gray-600 leading-relaxed">
                Conecta tu cuenta bancaria o PayPal una sola vez de forma segura.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Play className="w-10 h-10 text-white" />
              </div>
              <div className="w-1 h-12 bg-gradient-to-b from-purple-500 to-pink-600 mx-auto mb-6 md:hidden"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Solicita</h3>
              <p className="text-gray-600 leading-relaxed">
                Cuando estés listo, crea una solicitud de retiro desde tu panel en menos de un minuto.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Recibe</h3>
              <p className="text-gray-600 leading-relaxed">
                Procesamos tu pago rápidamente y te notificamos en cada paso del camino hasta que el dinero está en tu
                cuenta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">¿Listo para tomar el control de tus finanzas?</h2>
          <Link href="/login">
            <Button className="bg-white hover:bg-gray-100 text-black px-8 py-3 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105">
              Iniciar Sesión Ahora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                creator's wallet
              </h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                La plataforma exclusiva para artistas donde gestionas tus finanzas con total transparencia y seguridad.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <span className="text-sm font-bold">t</span>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <span className="text-sm font-bold">in</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Dashboard</li>
                <li className="hover:text-white transition-colors cursor-pointer">Retiros</li>
                <li className="hover:text-white transition-colors cursor-pointer">Historial</li>
                <li className="hover:text-white transition-colors cursor-pointer">Configuración</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Centro de Ayuda</li>
                <li className="hover:text-white transition-colors cursor-pointer">Contacto</li>
                <li className="hover:text-white transition-colors cursor-pointer">FAQ</li>
                <li className="hover:text-white transition-colors cursor-pointer">Estado del Sistema</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 creator's wallet. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <span className="hover:text-white transition-colors cursor-pointer">Términos de Servicio</span>
              <span className="hover:text-white transition-colors cursor-pointer">Política de Privacidad</span>
              <span className="hover:text-white transition-colors cursor-pointer">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}