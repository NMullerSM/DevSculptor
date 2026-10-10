import { DiagramCatalogItem } from '../diagram.types';
import {
  buildProjectUmlClassesSpec,
  buildProjectModularPackagesSpec,
  buildProjectSequenceE2eSpec,
  buildProjectAdrStateMachineSpec,
  buildProjectC4ComponentsSpec,
  buildProjectCloudDeploymentSpec,
  buildProjectErdMapSpec,
  buildProjectGovernancePipelineSpec,
} from './projectBuilders';

export const DIAGRAM_CATALOG: DiagramCatalogItem[] = [
  {
    id: 'project-uml-classes',
    title: 'Diagrama de Clases del Dominio',
    subtitle: 'Entidades, métodos CRUD y asociaciones derivadas del modelo',
    description:
      'Formalizado en OKF-004-UML-CLASS. Modela la estructura estática de entidades, métodos CRUD y multiplicidades relacionales.',
    category: 'project',
    kind: 'graph',
    badge: 'OKF-004 UML',
    icon: 'class',
    getSpec: (ctx) => buildProjectUmlClassesSpec(ctx),
  },
  {
    id: 'project-modular-packages',
    title: 'Diagrama de Paquetes y Módulos',
    subtitle: 'Capas de software, límites de contexto y control de dependencias',
    description:
      'Formalizado en OKF-005-UML-MODULAR-PACKAGES. Visualiza la división por paquetes según el estilo arquitectural del proyecto.',
    category: 'project',
    kind: 'graph',
    badge: 'OKF-005 PACKAGES',
    icon: 'inventory_2',
    getSpec: (ctx) => buildProjectModularPackagesSpec(ctx),
  },
  {
    id: 'project-sequence-e2e',
    title: 'Diagrama de Secuencia E2E',
    subtitle: 'Simulación interactiva paso a paso de interacción entre capas',
    description:
      'Formalizado en OKF-006-UML-SEQUENCE. Flujo temporal completo desde la petición del usuario hasta la persistencia y respuesta.',
    category: 'project',
    kind: 'sequence',
    badge: 'OKF-006 SEQUENCE',
    icon: 'swap_horiz',
    getSpec: (ctx) => buildProjectSequenceE2eSpec(ctx),
  },
  {
    id: 'project-adr-state-machine',
    title: 'Máquina de Estados de ADRs',
    subtitle: 'Ciclo de vida PROPOSED → ACCEPTED | REJECTED con métricas reales',
    description:
      'Formalizado en OKF-007-STATE-MACHINE. Transiciones auditadas de Decisiones Arquitecturales mediante Human-in-the-Loop.',
    category: 'project',
    kind: 'graph',
    badge: 'OKF-007 ADR',
    icon: 'traffic',
    getSpec: (ctx) => buildProjectAdrStateMachineSpec(ctx),
  },
  {
    id: 'project-c4-components',
    title: 'Diagrama de Componentes C4',
    subtitle: 'Subsistemas internos: UI Client, Gateway, Services y Repositorios',
    description:
      'Formalizado en OKF-008-UML-COMPONENTS. Descomposición C4 a nivel de componentes de software para la arquitectura del sistema.',
    category: 'project',
    kind: 'graph',
    badge: 'OKF-008 C4',
    icon: 'dashboard',
    getSpec: (ctx) => buildProjectC4ComponentsSpec(ctx),
  },
  {
    id: 'project-cloud-deployment',
    title: 'Diagrama de Despliegue en la Nube',
    subtitle: 'Topología de nodos: Edge CDN, API Container, PostgreSQL DB y S3',
    description:
      'Formalizado en OKF-009-UML-DEPLOYMENT. Infraestructura de ejecución, conectividad y distribución para producción.',
    category: 'project',
    kind: 'graph',
    badge: 'OKF-009 DEPLOY',
    icon: 'cloud_queue',
    getSpec: (ctx) => buildProjectCloudDeploymentSpec(ctx),
  },
  {
    id: 'project-erd-map',
    title: 'Diagrama Entidad-Relación (ERD)',
    subtitle: 'Tablas modeladas en el Canvas, columnas y claves foráneas',
    description:
      'Formalizado en OKF-010-DB-ERD-DICTIONARY. Esquema relacional 3FN completo con integridad referencial activa.',
    category: 'project',
    kind: 'graph',
    badge: 'OKF-010 ERD',
    icon: 'schema',
    getSpec: (ctx) => buildProjectErdMapSpec(ctx),
  },
  {
    id: 'project-governance-pipeline',
    title: 'Pipeline de Gobernanza del Proyecto',
    subtitle: 'Requisitos (RF/RNF) → ADRs → Modelo ERD → Bóveda OKF',
    description:
      'Formalizado en OKF-001/002/003. Trazabilidad integral de avance de los artefactos de ingeniería del proyecto.',
    category: 'project',
    kind: 'graph',
    badge: 'OKF PIPELINE',
    icon: 'linear_scale',
    getSpec: (ctx) => buildProjectGovernancePipelineSpec(ctx),
  },
];

export function getDiagramCatalogItem(id: string): DiagramCatalogItem | undefined {
  return DIAGRAM_CATALOG.find((item) => item.id === id);
}
