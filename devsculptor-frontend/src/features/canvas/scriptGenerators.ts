import { CanvasEntity } from '@/types/canvas.types';

export function generatePostgreSqlDdl(entities: CanvasEntity[]): string {
  if (entities.length === 0) return '-- No hay tablas definidas en el Canvas.';

  let ddl = `-- ==========================================================================\n`;
  ddl += `-- DevSculptor DDL Compilation — PostgreSQL 15+ (3FN Normalizado)\n`;
  ddl += `-- Generado automáticamente a partir del Canvas ERD\n`;
  ddl += `-- ==========================================================================\n\n`;
  ddl += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;

  entities.forEach((entity) => {
    ddl += `CREATE TABLE IF NOT EXISTS ${entity.table_name} (\n`;
    const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
    const lines = cols.map((c) => {
      let line = `  ${c.name} ${c.type}`;
      if (c.isPk) line += ' PRIMARY KEY';
      if (c.unique) line += ' UNIQUE';
      if (c.nullable === false && !c.isPk) line += ' NOT NULL';
      return line;
    });

    // Default timestamps
    lines.push(`  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    lines.push(`  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`);

    ddl += lines.join(',\n');
    ddl += `\n);\n\n`;

    // RLS Policy boilerplate
    ddl += `ALTER TABLE ${entity.table_name} ENABLE ROW LEVEL SECURITY;\n\n`;
  });

  return ddl;
}

export function generateTypeScriptDtos(entities: CanvasEntity[]): string {
  if (entities.length === 0) return '// No hay entidades en el Canvas.';

  let ts = `import { z } from 'zod';\n\n`;
  ts += `/**\n * DevSculptor TypeScript DTOs & Schemas Zod (SSOT)\n */\n\n`;

  entities.forEach((entity) => {
    const pascalName = entity.table_name
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');

    ts += `export const ${entity.table_name}Schema = z.object({\n`;
    const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
    cols.forEach((c) => {
      let zodType = 'z.string()';
      const t = c.type.toLowerCase();
      if (t.includes('uuid')) zodType = 'z.string().uuid()';
      else if (t.includes('int') || t.includes('serial')) zodType = 'z.number().int()';
      else if (t.includes('bool')) zodType = 'z.boolean()';
      else if (t.includes('json')) zodType = 'z.record(z.unknown())';

      if (c.nullable) zodType += '.optional().nullable()';
      ts += `  ${c.name}: ${zodType},\n`;
    });
    ts += `  created_at: z.string().datetime().optional(),\n`;
    ts += `  updated_at: z.string().datetime().optional(),\n`;
    ts += `});\n\n`;
    ts += `export type ${pascalName}Dto = z.infer<typeof ${entity.table_name}Schema>;\n\n`;
  });

  return ts;
}

export function generateJsonSchema(entities: CanvasEntity[]): string {
  const schemas: Record<string, unknown> = {};

  entities.forEach((entity) => {
    const properties: Record<string, { type: string; format?: string }> = {};
    const required: string[] = [];

    const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
    cols.forEach((c) => {
      let jsonType = 'string';
      const t = c.type.toLowerCase();
      if (t.includes('int') || t.includes('serial')) jsonType = 'integer';
      else if (t.includes('bool')) jsonType = 'boolean';
      else if (t.includes('json')) jsonType = 'object';

      properties[c.name] = { type: jsonType };
      if (t.includes('uuid')) properties[c.name].format = 'uuid';
      if (!c.nullable) required.push(c.name);
    });

    schemas[entity.table_name] = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: entity.table_name,
      type: 'object',
      properties,
      required,
    };
  });

  return JSON.stringify(schemas, null, 2);
}

export function generatePythonPydantic(entities: CanvasEntity[]): string {
  if (entities.length === 0) return '# No hay entidades en el Canvas.';

  let py = `from pydantic import BaseModel, Field\nfrom typing import Optional, Any, Dict\nfrom datetime import datetime\nfrom uuid import UUID\n\n`;

  entities.forEach((entity) => {
    const pascalName = entity.table_name
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');

    py += `class ${pascalName}Model(BaseModel):\n`;
    const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
    cols.forEach((c) => {
      let pyType = 'str';
      const t = c.type.toLowerCase();
      if (t.includes('uuid')) pyType = 'UUID';
      else if (t.includes('int') || t.includes('serial')) pyType = 'int';
      else if (t.includes('bool')) pyType = 'bool';
      else if (t.includes('json')) pyType = 'Dict[str, Any]';

      if (c.nullable) {
        py += `    ${c.name}: Optional[${pyType}] = None\n`;
      } else {
        py += `    ${c.name}: ${pyType}\n`;
      }
    });
    py += `    created_at: Optional[datetime] = None\n`;
    py += `    updated_at: Optional[datetime] = None\n\n`;
    py += `    class Config:\n`;
    py += `        from_attributes = True\n\n`;
  });

  return py;
}
