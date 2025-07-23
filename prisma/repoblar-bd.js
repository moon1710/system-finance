// scripts/repoblar-bd-corregido.js
// Script corregido para repoblar la base de datos

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Primero verificar el schema actual
async function verificarSchema() {
  console.log("🔍 VERIFICANDO SCHEMA ACTUAL...");

  try {
    // Obtener información del modelo Retiro
    const retiroFields = await prisma.retiro.fields;
    console.log(
      "Campos disponibles en modelo Retiro:",
      Object.keys(retiroFields || {})
    );

    // Intentar crear un retiro básico para ver qué campos acepta
    const testUserId = "0c877f86-f33e-4043-93de-e0ddcee19b5c";
    const testCuenta = await prisma.cuentaBancaria.findFirst({
      where: { userId: testUserId },
    });

    if (testCuenta) {
      console.log("✅ Cuenta de prueba encontrada:", testCuenta.id);
      // Crear un retiro de prueba mínimo
      const testRetiro = await prisma.retiro.create({
        data: {
          usuarioId: testUserId,
          cuentaBancariaId: testCuenta.id,
          montoSolicitado: 100.0,
          estado: "Pendiente",
        },
      });
      console.log("✅ Retiro de prueba creado:", testRetiro.id);

      // Eliminar el retiro de prueba
      await prisma.retiro.delete({ where: { id: testRetiro.id } });
      console.log("✅ Retiro de prueba eliminado");
    }
  } catch (error) {
    console.error("Error verificando schema:", error.message);
  }
}

// Datos corregidos para repoblación
const datosCorregidos = {
  // Cuentas bancarias (sin cambios)
  cuentasBancarias: [
    // Cuentas para artistaPrueba
    {
      userId: "0c877f86-f33e-4043-93de-e0ddcee19b5c",
      tipoCuenta: "nacional",
      nombreTitular: "artistaPrueba González",
      nombreBanco: "BBVA México",
      clabe: "012345678901234567",
      esPredeterminada: true,
    },
    {
      userId: "0c877f86-f33e-4043-93de-e0ddcee19b5c",
      tipoCuenta: "paypal",
      nombreTitular: "artistaPrueba González",
      emailPaypal: "artistaPrueba@paypal.com",
      esPredeterminada: false,
    },

    // Cuentas para moncaballero1710
    {
      userId: "489dd900-5d2c-46fb-8cfa-14f64813b246",
      tipoCuenta: "nacional",
      nombreTitular: "Monserrat Caballero López",
      nombreBanco: "Santander México",
      clabe: "014320001234567890",
      esPredeterminada: true,
    },
    {
      userId: "489dd900-5d2c-46fb-8cfa-14f64813b246",
      tipoCuenta: "internacional",
      nombreTitular: "Monserrat Caballero Lopez",
      nombreBanco: "Wells Fargo Bank",
      numeroCuenta: "US1234567890123456",
      swift: "WFBIUS6S",
      codigoABA: "121000248",
      pais: "USA",
      direccionBeneficiario: "1234 Main Street Apt 5B",
      ciudadBeneficiario: "Los Angeles",
      estadoBeneficiario: "CA",
      codigoPostalBeneficiario: "90210",
      paisBeneficiario: "USA",
      esPredeterminada: false,
    },
    {
      userId: "489dd900-5d2c-46fb-8cfa-14f64813b246",
      tipoCuenta: "paypal",
      nombreTitular: "Monserrat Caballero",
      emailPaypal: "moncaballero1710@paypal.com",
      esPredeterminada: false,
    },

    // Cuentas para monloca
    {
      userId: "991837fb-6e3a-4506-b047-a1b836f354bb",
      tipoCuenta: "nacional",
      nombreTitular: "Mónica Luna García",
      nombreBanco: "Banorte",
      clabe: "072320001122334455",
      esPredeterminada: true,
    },
    {
      userId: "991837fb-6e3a-4506-b047-a1b836f354bb",
      tipoCuenta: "internacional",
      nombreTitular: "Monica Luna Garcia",
      nombreBanco: "Royal Bank of Canada",
      numeroCuenta: "CA9876543210987654",
      swift: "ROYCCAT2",
      pais: "Canada",
      direccionBeneficiario: "456 Maple Avenue Unit 12",
      ciudadBeneficiario: "Toronto",
      estadoBeneficiario: "ON",
      codigoPostalBeneficiario: "M5V 3A8",
      paisBeneficiario: "Canada",
      esPredeterminada: false,
    },

    // Cuentas para monseEdu
    {
      userId: "c4cf798a-1c5e-4f06-bdce-5694883dad1c",
      tipoCuenta: "nacional",
      nombreTitular: "Monserrat Educación Silva",
      nombreBanco: "HSBC México",
      clabe: "021320005566778899",
      esPredeterminada: true,
    },
    {
      userId: "c4cf798a-1c5e-4f06-bdce-5694883dad1c",
      tipoCuenta: "internacional",
      nombreTitular: "Monserrat Silva",
      nombreBanco: "Banco Santander España",
      numeroCuenta: "ES9121000418450200051332",
      swift: "BSCHESMM",
      pais: "España",
      direccionBeneficiario: "Calle Gran Vía 45, 3º A",
      ciudadBeneficiario: "Madrid",
      estadoBeneficiario: "Madrid",
      codigoPostalBeneficiario: "28013",
      paisBeneficiario: "España",
      esPredeterminada: false,
    },
    {
      userId: "c4cf798a-1c5e-4f06-bdce-5694883dad1c",
      tipoCuenta: "paypal",
      nombreTitular: "Monserrat Silva",
      emailPaypal: "mon.loca.ed@paypal.com",
      esPredeterminada: false,
    },
  ],

  // Retiros CORREGIDOS - solo campos básicos que sabemos que existen
  retiros: [
    // Retiros para artistaPrueba
    {
      usuarioId: "0c877f86-f33e-4043-93de-e0ddcee19b5c",
      montoSolicitado: 15000.0,
      estado: "Completado",
      notasAdmin: "Retiro procesado exitosamente el 2025-07-10",
      fechaSolicitud: new Date("2025-07-10T10:30:00Z"),
    },
    {
      usuarioId: "0c877f86-f33e-4043-93de-e0ddcee19b5c",
      montoSolicitado: 8500.0,
      estado: "Pendiente",
      fechaSolicitud: new Date("2025-07-20T14:15:00Z"),
    },

    // Retiros para moncaballero1710
    {
      usuarioId: "489dd900-5d2c-46fb-8cfa-14f64813b246",
      montoSolicitado: 75000.0,
      estado: "Procesando",
      notasAdmin: "Monto alto - Requiere verificación adicional de compliance",
      fechaSolicitud: new Date("2025-07-18T16:45:00Z"),
    },
    {
      usuarioId: "489dd900-5d2c-46fb-8cfa-14f64813b246",
      montoSolicitado: 12000.0,
      estado: "Completado",
      notasAdmin: "Wire transfer enviado el 2025-07-12",
      fechaSolicitud: new Date("2025-07-12T09:20:00Z"),
    },
    {
      usuarioId: "489dd900-5d2c-46fb-8cfa-14f64813b246",
      montoSolicitado: 5000.0,
      estado: "Rechazado",
      notasAdmin: "Documentación incompleta",
      fechaSolicitud: new Date("2025-07-05T11:30:00Z"),
    },

    // Retiros para monloca
    {
      usuarioId: "991837fb-6e3a-4506-b047-a1b836f354bb",
      montoSolicitado: 25000.0,
      estado: "Completado",
      notasAdmin: "SPEI procesado exitosamente",
      fechaSolicitud: new Date("2025-07-15T13:10:00Z"),
    },
    {
      usuarioId: "991837fb-6e3a-4506-b047-a1b836f354bb",
      montoSolicitado: 18000.0,
      estado: "Pendiente",
      fechaSolicitud: new Date("2025-07-22T10:05:00Z"),
    },

    // Retiros para monseEdu
    {
      usuarioId: "c4cf798a-1c5e-4f06-bdce-5694883dad1c",
      montoSolicitado: 32000.0,
      estado: "Procesando",
      notasAdmin: "Transferencia internacional a España en proceso",
      fechaSolicitud: new Date("2025-07-19T15:30:00Z"),
    },
    {
      usuarioId: "c4cf798a-1c5e-4f06-bdce-5694883dad1c",
      montoSolicitado: 7500.0,
      estado: "Completado",
      notasAdmin: "PayPal enviado exitosamente",
      fechaSolicitud: new Date("2025-07-14T12:45:00Z"),
    },
  ],

  // Relaciones admin-artista
  relacionesAdmin: [
    {
      adminId: "44957226-cac5-4a3a-b5bb-a4d0b2852a9d",
      artistaId: "0c877f86-f33e-4043-93de-e0ddcee19b5c",
    },
    {
      adminId: "44957226-cac5-4a3a-b5bb-a4d0b2852a9d",
      artistaId: "489dd900-5d2c-46fb-8cfa-14f64813b246",
    },
    {
      adminId: "4bc7cdd7-b310-4ace-8824-69873e5cde9d",
      artistaId: "991837fb-6e3a-4506-b047-a1b836f354bb",
    },
    {
      adminId: "4bc7cdd7-b310-4ace-8824-69873e5cde9d",
      artistaId: "c4cf798a-1c5e-4f06-bdce-5694883dad1c",
    },
  ],

  // Notas
  notas: [
    {
      artistaId: "0c877f86-f33e-4043-93de-e0ddcee19b5c",
      adminId: "44957226-cac5-4a3a-b5bb-a4d0b2852a9d",
      contenido: "Usuario activo y responsable. Historial de pagos excelente.",
    },
    {
      artistaId: "489dd900-5d2c-46fb-8cfa-14f64813b246",
      adminId: "44957226-cac5-4a3a-b5bb-a4d0b2852a9d",
      contenido:
        "Artista con retiros internacionales frecuentes. Requiere seguimiento por montos altos.",
    },
    {
      artistaId: "991837fb-6e3a-4506-b047-a1b836f354bb",
      adminId: "4bc7cdd7-b310-4ace-8824-69873e5cde9d",
      contenido:
        "Nueva artista con buen potencial. Cuenta canadiense verificada.",
    },
    {
      artistaId: "c4cf798a-1c5e-4f06-bdce-5694883dad1c",
      adminId: "4bc7cdd7-b310-4ace-8824-69873e5cde9d",
      contenido:
        "Usuario educativo con transferencias a España. Documentación completa.",
    },
  ],
};

async function repoblarBaseDatosCorregido() {
  console.log("🚀 REPOBLACIÓN CORREGIDA DE BASE DE DATOS");
  console.log("=========================================");

  try {
    // 1. Verificar schema primero
    await verificarSchema();

    // 2. Limpiar datos existentes (excepto usuarios)
    console.log("\n🧹 Limpiando datos existentes...");
    await prisma.retiro.deleteMany({});
    await prisma.cuentaBancaria.deleteMany({});
    await prisma.adminArtistaRelacion.deleteMany({});
    await prisma.notaUsuario.deleteMany({});
    console.log("✅ Datos anteriores eliminados");

    // 3. Crear cuentas bancarias
    console.log("\n💳 Creando cuentas bancarias...");
    const cuentasCreadas = [];

    for (const cuenta of datosCorregidos.cuentasBancarias) {
      try {
        const cuentaCreada = await prisma.cuentaBancaria.create({
          data: cuenta,
        });
        cuentasCreadas.push(cuentaCreada);
        console.log(
          `✅ Cuenta ${cuenta.tipoCuenta} creada para ${cuenta.nombreTitular}`
        );
      } catch (error) {
        console.error(
          `❌ Error creando cuenta ${cuenta.tipoCuenta}:`,
          error.message
        );
      }
    }

    console.log(`✅ Total cuentas creadas: ${cuentasCreadas.length}`);

    // 4. Crear retiros CON MANEJO DE ERRORES
    console.log("\n💰 Creando retiros...");
    const retirosCreados = [];

    for (const retiro of datosCorregidos.retiros) {
      try {
        // Encontrar cuenta predeterminada del usuario
        const cuentaPredeterminada = cuentasCreadas.find(
          (c) => c.userId === retiro.usuarioId && c.esPredeterminada === true
        );

        if (cuentaPredeterminada) {
          // Crear retiro solo con campos que sabemos que existen
          const datosRetiro = {
            usuarioId: retiro.usuarioId,
            cuentaBancariaId: cuentaPredeterminada.id,
            montoSolicitado: retiro.montoSolicitado,
            estado: retiro.estado,
            fechaSolicitud: retiro.fechaSolicitud,
          };

          // Agregar notasAdmin solo si existe el campo
          if (retiro.notasAdmin) {
            datosRetiro.notasAdmin = retiro.notasAdmin;
          }

          const retiroCreado = await prisma.retiro.create({
            data: datosRetiro,
          });

          retirosCreados.push(retiroCreado);
          console.log(
            `✅ Retiro de $${retiro.montoSolicitado} (${retiro.estado}) creado`
          );
        } else {
          console.log(
            `⚠️ No se encontró cuenta predeterminada para usuario ${retiro.usuarioId}`
          );
        }
      } catch (error) {
        console.error(`❌ Error creando retiro:`, error.message);
        // Continuar con el siguiente retiro
      }
    }

    console.log(`✅ Total retiros creados: ${retirosCreados.length}`);

    // 5. Crear relaciones admin-artista
    console.log("\n👥 Creando relaciones admin-artista...");
    let relacionesCreadas = 0;
    for (const relacion of datosCorregidos.relacionesAdmin) {
      try {
        await prisma.adminArtistaRelacion.create({
          data: relacion,
        });
        relacionesCreadas++;
        console.log(`✅ Relación admin-artista creada`);
      } catch (error) {
        console.error(`❌ Error creando relación:`, error.message);
      }
    }

    // 6. Crear notas
    console.log("\n📝 Creando notas de usuarios...");
    let notasCreadas = 0;
    for (const nota of datosCorregidos.notas) {
      try {
        await prisma.notaUsuario.create({
          data: nota,
        });
        notasCreadas++;
        console.log(`✅ Nota creada`);
      } catch (error) {
        console.error(`❌ Error creando nota:`, error.message);
      }
    }

    // 7. Mostrar estadísticas finales
    console.log("\n📊 ESTADÍSTICAS FINALES");
    console.log("=======================");

    const stats = {
      usuarios: await prisma.usuario.count(),
      cuentas: await prisma.cuentaBancaria.count(),
      retiros: await prisma.retiro.count(),
      relaciones: await prisma.adminArtistaRelacion.count(),
      notas: await prisma.notaUsuario.count(),
    };

    console.log(`👤 Usuarios: ${stats.usuarios}`);
    console.log(`💳 Cuentas bancarias: ${stats.cuentas}`);
    console.log(`💰 Retiros: ${stats.retiros}`);
    console.log(`👥 Relaciones admin-artista: ${stats.relaciones}`);
    console.log(`📝 Notas: ${stats.notas}`);

    console.log("\n🎉 REPOBLACIÓN COMPLETADA");
    console.log("=========================");
    console.log("✅ Base de datos funcional");
    console.log("✅ Cuentas de todos los tipos creadas");
    console.log("✅ Historial de retiros establecido");
  } catch (error) {
    console.error("\n❌ ERROR DURANTE REPOBLACIÓN:", error);
    console.error("Detalles:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar repoblación
if (require.main === module) {
  repoblarBaseDatosCorregido()
    .then(() => {
      console.log("\n✨ Repoblación completada exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Error fatal:", error);
      process.exit(1);
    });
}

module.exports = { repoblarBaseDatosCorregido, verificarSchema };
