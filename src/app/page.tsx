// app/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">Bienvenido a la plataforma de pagos</h1>
      <p className="text-lg">Por favor, <a href="/login" className="text-blue-500 underline">inicia sesión</a></p>
    </main>
  )
}
