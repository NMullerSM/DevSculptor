import { z } from 'zod';

export const columnDefinitionSchema = z.object({
  name: z.string().min(1, 'El nombre de la columna es requerido'),
  type: z.string().min(1, 'El tipo de dato es requerido'),
  is_pk: z.boolean().default(false),
  nullable: z.boolean().default(true),
  default_value: z.string().optional(),
});

export const createCanvasEntitySchema = z.object({
  table_name: z
    .string()
    .min(1, 'El nombre de tabla es requerido')
    .max(100)
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'El nombre de la tabla debe contener solo letras, números y guiones bajos, iniciando con letra o guion bajo'
    ),
  columns_json: z.array(columnDefinitionSchema).default([]),
  position_x: z.number().int().default(0),
  position_y: z.number().int().default(0),
});

export const updateCanvasEntitySchema = z
  .object({
    table_name: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
      .optional(),
    columns_json: z.array(columnDefinitionSchema).optional(),
    position_x: z.number().int().optional(),
    position_y: z.number().int().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'Debe proveer al menos un campo para actualizar'
  );

export const projectAndCanvasParamsSchema = z.object({
  projectId: z.string().uuid('ID de proyecto inválido'),
  canvasId: z.string().uuid('ID de entidad de canvas inválido'),
});

export type ColumnDefinition = z.infer<typeof columnDefinitionSchema>;
export type CreateCanvasEntityDto = z.infer<typeof createCanvasEntitySchema>;
export type UpdateCanvasEntityDto = z.infer<typeof updateCanvasEntitySchema>;
export type ProjectAndCanvasParams = z.infer<typeof projectAndCanvasParamsSchema>;
