# Sprint 3 — Especificación Técnica de Gobernanza Arquitectónica, Ciclo de Vida ADR y Verificación Human-in-the-Loop

**Proyecto:** DevSculptor Core Backend  
**Versión:** 1.1.0 (Sprint 3 — Épica C: Gobernanza Técnica Pre-Código)  
**Autor:** Nathaniel Muller San Martin  
**Estado:** IMPLEMENTADO Y MIGRADO EN `develop`  
**Patrón Arquitectónico:** Monolito Modular Layered MVC + State Machine Flexible con Firma de Auditoría Humana  

---

## 1. Resumen Ejecutivo y Motivación de Arquitectura

En las fases tempranas de diseño de software (fase pre-código), imponer un estilo arquitectónico rígido de forma prematura durante la creación del proyecto contradice el principio de **Gobernanza Progresiva Asistida por IA**. La arquitectura de un sistema debe emerger de un análisis riguroso de requisitos (RF/RNF) y fuerzas concurrentes documentadas en un **Registro de Decisiones de Arquitectura (ADR)** formal.

### Objetivos Clave de la Evolución:
1. **Desacoplamiento de la Elección Arquitectónica Inicial:**
   - La tabla `projects` deja de exigir una arquitectura canónica inmediata.
   - El estilo arquitectónico se inicializa por defecto en `'Por Definir / En Evaluación'`.
   - Se incorporan metadatos institucionales de alto valor organizativo: `organization` (empresa/organización cliente) y `lead_architect` (responsable técnico).
2. **Ciclo de Vida Flexible y Reabrible de Actas ADR:**
   - Previamente, las actas en estado `ACCEPTED` o `REJECTED` estaban bloqueadas de forma inmutable a nivel de servicio.
   - Se flexibiliza la máquina de estados en `decisions.service.ts` para habilitar transiciones entre cualquier estado válido (`PROPOSED`, `ACCEPTED`, `REJECTED`), permitiendo la reapertura justificada para reevaluación técnica o revocación formal.
3. **Blindaje Human-in-the-Loop contra Decisiones Autónomas de IA:**
   - Los modelos de lenguaje y agentes de IA tienen **estrictamente prohibido auto-ratificar o mutar el estado de las actas ADR**.
   - La IA solo puede proponer alternativas en estado `PROPOSED`. Toda transición a `ACCEPTED` o `REJECTED` exige la certificación explícita de un arquitecto humano.

---

## 2. Artefactos de Base de Datos y Persistencia

### 2.1. Migración DDL `004_project_governance_metadata.sql`
Se creó y ejecutó exitosamente la migración DDL sobre PostgreSQL (Supabase):

```sql
-- 004_project_governance_metadata.sql
-- Agrega metadatos de gobernanza institucional a la tabla projects

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS organization VARCHAR(255),
  ADD COLUMN IF NOT EXISTS lead_architect VARCHAR(255);
```

### 2.2. Capa de Repositorio (`ProjectsRepository`)
Se actualizaron los contratos de entidad y la lista blanca de columnas seguras para inserción parametrizada:

```typescript
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  architecture_style: string | null;
  organization: string | null;
  lead_architect: string | null;
  created_at: Date;
  updated_at: Date;
}

export class ProjectsRepository extends BaseRepository<Project> {
  constructor() {
    super('projects', [
      'user_id',
      'name',
      'description',
      'architecture_style',
      'organization',
      'lead_architect',
    ]);
  }
}
```

---

## 3. Contratos DTO y Validación con Zod (SSOT)

En `projects.dto.ts`, los esquemas Zod se expandieron para validar la nueva metadata de gobernanza:

```typescript
export const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido').max(255),
  description: z.string().optional(),
  architecture_style: z.string().max(100).optional(),
  organization: z.string().max(255).optional(),
  lead_architect: z.string().max(255).optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().min(1, 'El nombre no puede estar vacío').max(255).optional(),
    description: z.string().optional(),
    architecture_style: z.string().max(100).optional(),
    organization: z.string().max(255).optional(),
    lead_architect: z.string().max(255).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'Debe proveer al menos un campo para actualizar'
  );
```

---

## 4. Lógica de Dominio y Transición de Estados

### 4.1. Servicio de Proyectos (`ProjectsService`)
Al inicializar un proyecto, si no se especifica el estilo canónico, se asigna automáticamente `'Por Definir / En Evaluación'`:

```typescript
return this.projectsRepository.create({
  user_id: userId,
  name: dto.name.trim(),
  description: dto.description?.trim() || null,
  architecture_style: dto.architecture_style?.trim() || 'Por Definir / En Evaluación',
  organization: dto.organization?.trim() || null,
  lead_architect: dto.lead_architect?.trim() || null,
});
```

### 4.2. Servicio de Decisiones (`DecisionsService`)
Se eliminó la restricción que bloqueaba la reevaluación técnica de actas finalizadas. Ahora se registran las transiciones de estado con trazabilidad estructurada en Pino Logger:

```typescript
async updateStatus(
  userId: string,
  projectId: string,
  decisionId: string,
  dto: UpdateDecisionStatusDto
): Promise<ArchitectureDecision> {
  const existing = await this.findById(userId, projectId, decisionId);

  if (existing.status === dto.status) {
    return existing;
  }

  logger.info(
    { userId, projectId, decisionId, from: existing.status, to: dto.status },
    'Transición de estado de gobernanza ADR ratificada por arquitecto humano'
  );

  const updated = await this.decisionsRepository.update(decisionId, {
    status: dto.status,
  });

  if (!updated) {
    throw new NotFoundError('Decisión de Arquitectura');
  }

  return updated;
}
```

---

## 5. Directrices del Motor de IA (`ai.prompts.ts`)

Se blindó la instrucción del sistema (`SYSTEM_INSTRUCTION_ARCHITECT`) con dos reglas mandatorias:

1. **Gobernanza Human-in-the-Loop:**
   > *"La IA NUNCA puede ratificar, aceptar o cambiar de estado actas ADR por sí misma; la IA solo sugiere alternativas técnicas en estado PROPOSED. La ratificación (ACCEPTED) o descarte (REJECTED) requiere obligatoriamente verificación humana del Arquitecto de Software."*
2. **Evaluación de Estilos Canónicos:**
   > *"Si el proyecto tiene su estilo arquitectónico 'Por Definir / En Evaluación' o el usuario consulta sobre patrones, analiza objetivamente los estilos canónicos (Monolito Modular Layered MVC, Microservicios Desacoplados, Clean Architecture / Hexagonal, Event-Driven Architecture) y formula una propuesta ADR estructurada para que el arquitecto humano la certifique."*
