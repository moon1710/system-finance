Sistema de Gestión de Pagos 💸
Una aplicación web full-stack construida con Next.js 14 (App Router) y Prisma para gestionar de forma eficiente las solicitudes de pago de artistas. Incluye un panel de administración para la revisión, aprobación, y seguimiento de transacciones, junto a un sistema de alertas configurable.

✨ Características Principales
Autenticación por Roles: Sistema de sesión seguro con Iron Session que diferencia entre roles de admin y artista.

Gestión de Cuentas Bancarias: CRUD completo para que los artistas gestionen sus métodos de pago (Nacional, Internacional, PayPal).

Flujo de Retiros Completo: Desde la solicitud del artista hasta la aprobación y carga de comprobante por parte del administrador.

Sistema de Alertas Avanzado: Motor de alertas configurable que notifica a los administradores sobre transacciones de alto riesgo o inusuales (ej. montos altos, alta frecuencia).

Dashboard de Administración: Paneles centralizados para que los administradores gestionen usuarios, retiros y alertas de manera eficiente.

Almacenamiento Seguro: Subida y gestión de archivos (comprobantes de pago) en el sistema de archivos local de forma segura.

Base de Datos Tipada: Uso de Prisma como ORM para garantizar la seguridad de tipos de extremo a extremo entre la base de datos MySQL y la aplicación.

🛠️ Stack Tecnológico
Framework: Next.js 14+ (App Router)

Lenguaje: TypeScript

ORM: Prisma

Base de Datos: MySQL

Autenticación: Iron Session

Validaciones: Zod (implícito en las validaciones de datos)

🚀 Puesta en Marcha
Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

1. Prerrequisitos
Node.js (v18.17 o superior)

NPM o Yarn

Una instancia de MySQL en ejecución.

##colores
/* CSS HEX */
 --shark: #21252d;
--outer-space: #2b333c;
--blue-violet: #6762b3;
--wild-sand: #f7f7f7;
--empress: #7c777a;
--cornflower-blue: #527ceb;
--cerulean: #019fd2;
--picton-blue: #48b0f7;
--bright-turquoise: #10cfbd;
--gallery: #f0f0f0;


/* SCSS HEX */
$shark: #21252d;
$outer-space: #2b333c;
$blue-violet: #6762b3;
$wild-sand: #f7f7f7;
$empress: #7c777a;
$cornflower-blue: #527ceb;
$cerulean: #019fd2;
$picton-blue: #48b0f7;
$bright-turquoise: #10cfbd;
$gallery: #f0f0f0;


/* SCSS RGB */
--shark: rgba(33,37,45,255,1);
--outer-space: rgba(43,51,60,1);
--blue-violet: rgba(103,98,179,1);
--wild-sand: rgba(247,247,247,1);
--empress: rgba(124,119,122,1);
--cornflower-blue: rgba(82,124,235,255,1);
--cerulean: rgba(1,159,210,255,1);
--picton-blue: rgba(72,176,247,255,1);
--bright-turquoise: rgba(16,207,189,255,1);
--gallery: rgba(240,240,240,255,1);


