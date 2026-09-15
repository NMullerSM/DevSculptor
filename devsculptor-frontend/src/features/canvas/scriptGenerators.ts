import { CanvasEntity } from '@/types/canvas.types';

export type SqlDialect = 'postgres' | 'mysql' | 'sqlite' | 'oracle';

/**
 * Generador DDL para PostgreSQL 15+ (Estándar Nativo DevSculptor)
 */
export function generatePostgreSqlDdl(entities: CanvasEntity[]): string {
  if (entities.length === 0) return '-- No hay tablas definidas en el Canvas.';

  let ddl = `-- ==========================================================================\n`;
  ddl += `-- DevSculptor DDL Compilation — PostgreSQL 15+ (3FN Normalizado)\n`;
  ddl += `-- Generado automáticamente a partir del Canvas ERD\n`;
  ddl += `-- ==========================================================================\n\n`;
  ddl += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;

  const fkStatements: string[] = [];

  entities.forEach((entity) => {
    ddl += `CREATE TABLE IF NOT EXISTS ${entity.table_name} (\n`;
    const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
    const lines = cols.map((c) => {
      let line = `  ${c.name} ${c.type}`;
      if (c.isPk || c.is_pk) line += ' PRIMARY KEY';
      if (c.unique) line += ' UNIQUE';
      if (c.nullable === false && !(c.isPk || c.is_pk)) line += ' NOT NULL';

      // Foreign key tracking
      const targetTable = c.referencesTable || c.references_table;
      const targetCol = c.referencesColumn || c.references_column || 'id';
      if ((c.isFk || c.is_fk || targetTable) && targetTable) {
        fkStatements.push(
          `ALTER TABLE ${entity.table_name} ADD CONSTRAINT fk_${entity.table_name}_${c.name} ` +
          `FOREIGN KEY (${c.name}) REFERENCES ${targetTable}(${targetCol}) ON DELETE CASCADE;`
        );
      }
      return line;
    });

    // Default audit columns
    lines.push(`  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    lines.push(`  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`);

    ddl += lines.join(',\n');
    ddl += `\n);\n\n`;

    // RLS Policy boilerplate
    ddl += `ALTER TABLE ${entity.table_name} ENABLE ROW LEVEL SECURITY;\n\n`;
  });

  if (fkStatements.length > 0) {
    ddl += `-- ==========================================================================\n`;
    ddl += `-- Restricciones de Integridad Referencial (Foreign Keys)\n`;
    ddl += `-- ==========================================================================\n`;
    ddl += fkStatements.join('\n') + '\n\n';
  }

  return ddl;
}

/**
 * Generador DDL para MySQL 8.0+ / MariaDB
 */
export function generateMySqlDdl(entities: CanvasEntity[]): string {
  if (entities.length === 0) return '-- No hay tablas definidas en el Canvas.';

  let ddl = `-- ==========================================================================\n`;
  ddl += `-- DevSculptor DDL Compilation — MySQL 8.0+ / MariaDB\n`;
  ddl += `-- ==========================================================================\n\n`;
  ddl += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  const mapMySqlType = (type: string): string => {
    const t = type.toLowerCase();
    if (t.includes('uuid')) return 'CHAR(36)';
    if (t.includes('serial') || t.includes('bigint')) return 'BIGINT AUTO_INCREMENT';
    if (t.includes('int')) return 'INT';
    if (t.includes('bool')) return 'TINYINT(1)';
    if (t.includes('timestamptz') || t.includes('timestamp')) return 'DATETIME DEFAULT CURRENT_TIMESTAMP';
    if (t.includes('json')) return 'JSON';
    if (t.includes('text')) return 'LONGTEXT';
    return type;
  };

  const fkStatements: string[] = [];

  entities.forEach((entity) => {
    ddl += `CREATE TABLE IF NOT EXISTS \`${entity.table_name}\` (\n`;
    const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
    const lines = cols.map((c) => {
      let line = `  \`${c.name}\` ${mapMySqlType(c.type)}`;
      if (c.isPk || c.is_pk) line += ' PRIMARY KEY';
      if (c.unique) line += ' UNIQUE';
      if (c.nullable === false && !(c.isPk || c.is_pk)) line += ' NOT NULL';

      const targetTable = c.referencesTable || c.references_table;
      const targetCol = c.referencesColumn || c.references_column || 'id';
      if ((c.isFk || c.is_fk || targetTable) && targetTable) {
        fkStatements.push(
          `ALTER TABLE \`${entity.table_name}\` ADD CONSTRAINT \`fk_${entity.table_name}_${c.name}\` ` +
          `FOREIGN KEY (\`${c.name}\`) REFERENCES \`${targetTable}\`(\`${targetCol}\`) ON DELETE CASCADE;`
        );
      }
      return line;
    });

    lines.push(`  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    lines.push(`  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);

    ddl += lines.join(',\n');
    ddl += `\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
  });

  if (fkStatements.length > 0) {
    ddl += `-- Relaciones Foráneas\n`;
    ddl += fkStatements.join('\n') + '\n\n';
  }

  ddl += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  return ddl;
}

/**
 * Generador DDL para SQLite 3
 */
export function generateSqliteDdl(entities: CanvasEntity[]): string {
  if (entities.length === 0) return '-- No hay tablas definidas en el Canvas.';

  let ddl = `-- ==========================================================================\n`;
  ddl += `-- DevSculptor DDL Compilation — SQLite 3\n`;
  ddl += `-- ==========================================================================\n\n`;
  ddl += `PRAGMA foreign_keys = ON;\n\n`;

  const mapSqliteType = (type: string): string => {
    const t = type.toLowerCase();
    if (t.includes('int') || t.includes('serial') || t.includes('bool')) return 'INTEGER';
    if (t.includes('float') || t.includes('double') || t.includes('decimal')) return 'REAL';
    return 'TEXT';
  };

  entities.forEach((entity) => {
    ddl += `CREATE TABLE IF NOT EXISTS "${entity.table_name}" (\n`;
    const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
    const lines = cols.map((c) => {
      let line = `  "${c.name}" ${mapSqliteType(c.type)}`;
      if (c.isPk || c.is_pk) line += ' PRIMARY KEY';
      if (c.unique) line += ' UNIQUE';
      if (c.nullable === false && !(c.isPk || c.is_pk)) line += ' NOT NULL';
      return line;
    });

    // Foreign keys inline for SQLite
    cols.forEach((c) => {
      const targetTable = c.referencesTable || c.references_table;
      const targetCol = c.referencesColumn || c.references_column || 'id';
      if ((c.isFk || c.is_fk || targetTable) && targetTable) {
        lines.push(`  FOREIGN KEY ("${c.name}") REFERENCES "${targetTable}"("${targetCol}") ON DELETE CASCADE`);
      }
    });

    lines.push(`  "created_at" TEXT NOT NULL DEFAULT (datetime('now'))`);
    lines.push(`  "updated_at" TEXT NOT NULL DEFAULT (datetime('now'))`);

    ddl += lines.join(',\n');
    ddl += `\n);\n\n`;
  });

  return ddl;
}

/**
 * Generador DDL para Oracle Database 19c / 21c Enterprise
 */
export function generateOracleDdl(entities: CanvasEntity[]): string {
  if (entities.length === 0) return '-- No hay tablas definidas en el Canvas.';

  let ddl = `-- ==========================================================================\n`;
  ddl += `-- DevSculptor DDL Compilation — Oracle Database 19c / 21c Enterprise\n`;
  ddl += `-- ==========================================================================\n\n`;

  const mapOracleType = (type: string): string => {
    const t = type.toLowerCase();
    if (t.includes('uuid')) return 'VARCHAR2(36)';
    if (t.includes('serial') || t.includes('int')) return 'NUMBER(10)';
    if (t.includes('bool')) return 'NUMBER(1)';
    if (t.includes('timestamptz') || t.includes('timestamp')) return 'TIMESTAMP WITH TIME ZONE';
    if (t.includes('json')) return 'CLOB CHECK (json IS JSON)';
    if (t.includes('text')) return 'CLOB';
    if (t.includes('varchar')) return type.replace(/varchar/i, 'VARCHAR2');
    return 'VARCHAR2(255)';
  };

  const fkStatements: string[] = [];

  entities.forEach((entity) => {
    const tableNameUpper = entity.table_name.toUpperCase();
    ddl += `CREATE TABLE ${tableNameUpper} (\n`;
    const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
    const lines = cols.map((c) => {
      const colNameUpper = c.name.toUpperCase();
      let line = `  ${colNameUpper} ${mapOracleType(c.type)}`;
      if (c.isPk || c.is_pk) line += ' PRIMARY KEY';
      if (c.unique) line += ' UNIQUE';
      if (c.nullable === false && !(c.isPk || c.is_pk)) line += ' NOT NULL';

      const targetTable = c.referencesTable || c.references_table;
      const targetCol = c.referencesColumn || c.references_column || 'id';
      if ((c.isFk || c.is_fk || targetTable) && targetTable) {
        fkStatements.push(
          `ALTER TABLE ${tableNameUpper} ADD CONSTRAINT FK_${tableNameUpper}_${colNameUpper} ` +
          `FOREIGN KEY (${colNameUpper}) REFERENCES ${targetTable.toUpperCase()}(${targetCol.toUpperCase()}) ON DELETE CASCADE;`
        );
      }
      return line;
    });

    lines.push(`  CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL`);
    lines.push(`  UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL`);

    ddl += lines.join(',\n');
    ddl += `\n);\n/\n\n`;
  });

  if (fkStatements.length > 0) {
    ddl += `-- Oracle Foreign Keys\n`;
    ddl += fkStatements.join('\n') + '\n';
  }

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
