import { BenchmarkScenario } from './benchmark.types';

export const BENCHMARK_SCENARIOS: BenchmarkScenario[] = [
  {
    id: 'SCN-01',
    name: 'Refactorización de Billetera Digital Fintech (Saldo y Ledger Inmutable)',
    description: 'Conversación informal donde el usuario detecta problemas de precisión de coma flotante y solicita mutar wallets hacia enteros (cents), crear ledger inmutable y redactar ADR financiero.',
    initialContext: {
      projectName: 'NovaPay Neobank',
      projectDescription: 'Plataforma de pagos transaccionales de alta concurrencia.',
      organization: 'NovaPay Technologies',
      architectureStyle: 'Layered MVC',
      requirements: [
        {
          code: 'RF-01',
          title: 'Creación de Billetera Virtual para Usuarios',
          type: 'RF',
          priority: 'HIGH',
          description: 'Apertura de cuenta wallet asociada a usuario validado.',
        },
      ],
      entities: [
        {
          tableName: 'wallets',
          columns: [
            { name: 'id', type: 'UUID', isPk: true },
            { name: 'user_id', type: 'UUID', isFk: true, referencesTable: 'users' },
            { name: 'current_balance_float', type: 'FLOAT' },
            { name: 'currency', type: 'VARCHAR(3)' },
            { name: 'created_at', type: 'TIMESTAMP' },
          ],
        },
      ],
      decisions: [],
      nextRfCode: 'RF-02',
      nextRnfCode: 'RNF-01',
      nextAdrCode: 'ADR-01',
    },
    userPrompt: 'Oye, tenemos un problema grave en el módulo de pagos. Actualmente en la tabla wallets estamos guardando el saldo en un float o decimal suelto y eso nos genera descuadres numéricos inaceptables. Necesito que modifiques la tabla wallets para guardar el balance_cents como un entero grande o bigint, y quites ese current_balance_float viejo. Además, crea una tabla de ledger o transacciones inmutable que se vincule a la billetera. También plantéame los requisitos funcionales de esto y una decisión ADR sobre por qué usamos enteros para moneda y bloqueo pesimista.',
    expectedRubric: {
      canvas: {
        expectedTables: ['wallet_ledger', 'ledger_entries', 'wallet_transactions', 'transactions'],
        expectedColumns: {
          wallets: ['balance_cents'],
        },
        expectedDroppedColumns: {
          wallets: ['current_balance_float'],
        },
        expectedMutations: [
          { targetTableName: 'wallets', action: 'UPDATE' },
        ],
      },
      requirements: {
        minRfCount: 2,
        minRnfCount: 1,
        keyTopics: ['balance', 'cents', 'ledger', 'inmutable', 'transaccion', 'atomicidad', 'acid'],
      },
      decisions: {
        minAdrCount: 1,
        expectedKeywords: ['centavos', 'float', 'bigint', 'pesimista', 'entero', 'redondeo', 'precision'],
        mustBeProposed: true,
      },
    },
  },

  {
    id: 'SCN-02',
    name: 'Mutación de Esquema Automotriz y Telemetría Vehicular',
    description: 'El usuario solicita eliminar la columna color de vehicles, agregar el VIN único normalizado, diseñar la tabla de telemetría GPS y generar un diagrama de secuencia de reporte.',
    initialContext: {
      projectName: 'FleetTrack IoT',
      projectDescription: 'Monitoreo telemático de flotas vehiculares pesadas.',
      organization: 'FleetTrack Corp',
      architectureStyle: 'Event-Driven Architecture',
      requirements: [
        {
          code: 'RF-01',
          title: 'Registro de Vehículos en Flota',
          type: 'RF',
          priority: 'HIGH',
          description: 'Alta de chasis y asignación de placa única.',
        },
      ],
      entities: [
        {
          tableName: 'vehicles',
          columns: [
            { name: 'id', type: 'UUID', isPk: true },
            { name: 'plate_number', type: 'VARCHAR(20)', unique: true },
            { name: 'color', type: 'VARCHAR(50)' },
            { name: 'model', type: 'VARCHAR(100)' },
            { name: 'created_at', type: 'TIMESTAMP' },
          ],
        },
      ],
      decisions: [],
      nextRfCode: 'RF-02',
      nextRnfCode: 'RNF-01',
      nextAdrCode: 'ADR-01',
    },
    userPrompt: 'Hola, revisando el modelo de flota automotriz, la tabla vehicles tiene un campo color que ya no nos sirve para nada en la operación, bórralo. Pero necesitamos urgentemente identificar cada auto con su vin único de 17 caracteres para cumplir con la normativa de tránsito. Además agrégale una tabla vehicle_telemetry con gps_lat, gps_lng y speed_kmh que apunte a vehicles con clave foránea. Dame también el diagrama de secuencia de cómo un auto reporta sus pings de telemetría hacia la API.',
    expectedRubric: {
      canvas: {
        expectedTables: ['vehicle_telemetry', 'telemetry_events', 'telemetry'],
        expectedColumns: {
          vehicles: ['vin'],
        },
        expectedDroppedColumns: {
          vehicles: ['color'],
        },
        expectedMutations: [
          { targetTableName: 'vehicles', action: 'UPDATE' },
        ],
      },
      requirements: {
        minRfCount: 1,
        minRnfCount: 1,
        keyTopics: ['vin', 'telemetria', 'gps', 'velocidad', 'latencia', 'ingesta'],
      },
      diagrams: {
        expectedType: 'sequence',
        requiredMermaidKeywords: ['sequenceDiagram', 'vehicle', 'api', 'telemetry', 'db', 'post'],
      },
    },
  },

  {
    id: 'SCN-03',
    name: 'Blindaje y Auditoría HIPAA en Fichas Médicas de Pacientes',
    description: 'Solicitud de seguridad médica para mutar patients añadiendo encryption_key_id, crear logs de auditoría de acceso y formalizar requisitos no funcionales estrictos de confidencialidad.',
    initialContext: {
      projectName: 'Sanitas Cloud Care',
      projectDescription: 'Expediente clínico electrónico interoperable.',
      organization: 'Sanitas Global',
      architectureStyle: 'Clean Architecture',
      requirements: [],
      entities: [
        {
          tableName: 'patients',
          columns: [
            { name: 'id', type: 'UUID', isPk: true },
            { name: 'national_id', type: 'VARCHAR(30)', unique: true },
            { name: 'full_name', type: 'VARCHAR(150)' },
            { name: 'medical_record_number', type: 'VARCHAR(50)' },
            { name: 'created_at', type: 'TIMESTAMP' },
          ],
        },
      ],
      decisions: [],
      nextRfCode: 'RF-01',
      nextRnfCode: 'RNF-01',
      nextAdrCode: 'ADR-01',
    },
    userPrompt: 'Necesitamos blindar el expediente clínico para auditoría de cumplimiento HIPAA. En la tabla patients hay que agregar una columna encryption_key_id para manejar llaves rotativas de cifrado en reposo. Además necesitamos una tabla patient_access_logs para registrar quién consulta los datos médicos, desde qué IP y en qué fecha. Por favor genera los requisitos no funcionales de seguridad y confidencialidad médica, y un ADR recomendando cifrado de campos sensibles a nivel de aplicación con AES-256.',
    expectedRubric: {
      canvas: {
        expectedTables: ['patient_access_logs', 'medical_access_logs', 'audit_logs'],
        expectedColumns: {
          patients: ['encryption_key_id'],
        },
        expectedMutations: [
          { targetTableName: 'patients', action: 'UPDATE' },
        ],
      },
      requirements: {
        minRfCount: 1,
        minRnfCount: 2,
        keyTopics: ['hipaa', 'cifrado', 'auditoria', 'confidencialidad', 'acceso', 'aes'],
      },
      decisions: {
        minAdrCount: 1,
        expectedKeywords: ['aes-256', 'cifrado', 'hipaa', 'llaves', 'reposo', 'kms'],
        mustBeProposed: true,
      },
    },
  },

  {
    id: 'SCN-04',
    name: 'Despacho Logístico Dark Stores y Cancelación Atómica',
    description: 'Modificación de reglas de pedido y stock con compensación transaccional y diagrama de estados de la orden.',
    initialContext: {
      projectName: 'FlashMarket Express',
      projectDescription: 'Despacho ultrarrápido en menos de 15 minutos desde Dark Stores.',
      organization: 'FlashMarket Inc',
      architectureStyle: 'Monolito Modular Layered MVC',
      requirements: [
        {
          code: 'RF-01',
          title: 'Creación de Orden de Compra',
          type: 'RF',
          priority: 'HIGH',
          description: 'Registro de orden pendiente de despacho.',
        },
      ],
      entities: [
        {
          tableName: 'orders',
          columns: [
            { name: 'id', type: 'UUID', isPk: true },
            { name: 'status', type: 'VARCHAR(30)' },
            { name: 'total_amount', type: 'DECIMAL(12,2)' },
            { name: 'created_at', type: 'TIMESTAMP' },
          ],
        },
      ],
      decisions: [],
      nextRfCode: 'RF-02',
      nextRnfCode: 'RNF-01',
      nextAdrCode: 'ADR-01',
    },
    userPrompt: 'Buenas tardes arquitecto, en nuestro sistema de Dark Stores, si un cliente cancela antes de que el picker termine de armar la bolsa, se debe revertir la reserva de stock y procesar el reembolso automáticamente. Actualiza el requisito RF-01 o agrégate los requisitos de compensación de cancelación, y crea un diagrama de estados de una orden desde RECEIVED hasta CANCELLED con su reembolso.',
    expectedRubric: {
      requirements: {
        minRfCount: 2,
        keyTopics: ['cancelacion', 'reembolso', 'stock', 'compensacion', 'reserva', 'revertir'],
        expectedMutations: [
          { targetCode: 'RF-01', action: 'UPDATE' },
        ],
      },
      diagrams: {
        expectedType: 'state',
        requiredMermaidKeywords: ['stateDiagram', 'received', 'cancelled', 'refund'],
      },
    },
  },

  {
    id: 'SCN-05',
    name: 'Checkout E-Commerce con Idempotencia y Pasarela de Pagos',
    description: 'Adición de clave de idempotencia a orders, prevención de pagos duplicados y diagrama de secuencia de checkout.',
    initialContext: {
      projectName: 'OmniShop Retail',
      projectDescription: 'Comercio electrónico multicanal con pagos integrados.',
      organization: 'OmniShop Global',
      architectureStyle: 'Clean Architecture',
      requirements: [],
      entities: [
        {
          tableName: 'orders',
          columns: [
            { name: 'id', type: 'UUID', isPk: true },
            { name: 'user_id', type: 'UUID' },
            { name: 'amount', type: 'DECIMAL(10,2)' },
            { name: 'created_at', type: 'TIMESTAMP' },
          ],
        },
      ],
      decisions: [],
      nextRfCode: 'RF-01',
      nextRnfCode: 'RNF-01',
      nextAdrCode: 'ADR-01',
    },
    userPrompt: 'Queremos blindar el checkout para evitar pagos duplicados si el usuario presiona dos veces el botón de pagar o si la red falla. Necesito que en la tabla orders agregues la columna idempotency_key como texto único obligatorio. También genera los requisitos de validación con cabecera Idempotency-Key y un diagrama de secuencia de cómo la API valida la clave antes de llamar a la pasarela de pagos.',
    expectedRubric: {
      canvas: {
        expectedColumns: {
          orders: ['idempotency_key'],
        },
        expectedMutations: [
          { targetTableName: 'orders', action: 'UPDATE' },
        ],
      },
      requirements: {
        minRfCount: 1,
        minRnfCount: 1,
        keyTopics: ['idempotencia', 'idempotency-key', 'duplicado', 'pasarela', 'stripe', 'pago'],
      },
      diagrams: {
        expectedType: 'sequence',
        requiredMermaidKeywords: ['sequenceDiagram', 'idempotency', 'gateway', 'payment', 'orders'],
      },
    },
  },
];
