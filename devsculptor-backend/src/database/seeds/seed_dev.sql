-- seed_dev.sql
-- Datos semilla de desarrollo para DevSculptor

INSERT INTO users (id, email, password_hash, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev@devsculptor.test',
  '$2b$12$8Z3fs4Az1nfuPPmIaD69S.9eXgViRlfzG6UERWpChffItxjTW1JQ2',
  'Developer Test'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (id, user_id, name, description, architecture_style)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'DevSculptor Platform',
  'Plataforma de gobernanza técnica y documentación pre-código asistida por IA',
  'Modular Monolith'
) ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO requirements (id, project_id, code, title, description, type, priority)
VALUES
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'RF-01',
  'Registro y autenticación de usuarios',
  'El sistema debe permitir a los usuarios registrarse e iniciar sesión con JWT',
  'RF',
  'HIGH'
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'RNF-01',
  'Tiempo de respuesta en API',
  'Las consultas deben responder en menos de 200ms en el percentil 95',
  'RNF',
  'HIGH'
) ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO canvas_entities (id, project_id, table_name, columns_json, position_x, position_y)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'users',
  '[{"name": "id", "type": "UUID", "is_pk": true, "nullable": false}, {"name": "email", "type": "VARCHAR(255)", "is_pk": false, "nullable": false}, {"name": "created_at", "type": "TIMESTAMPTZ", "is_pk": false, "nullable": false}]'::jsonb,
  100,
  150
) ON CONFLICT (project_id, table_name) DO NOTHING;

INSERT INTO architecture_decisions (id, project_id, title, context, decision, status)
VALUES (
  '40000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Adopción de Monolito Modular',
  'Necesidad de iteración rápida sin la sobrecarga distribuida de microservicios',
  'Implementar Monolito Modular en Node.js + Express con capas estrictas de Transporte, Dominio y Persistencia',
  'ACCEPTED'
) ON CONFLICT DO NOTHING;
