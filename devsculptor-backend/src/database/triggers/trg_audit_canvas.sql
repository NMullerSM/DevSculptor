-- trg_audit_canvas.sql
-- Trigger y función para registrar auditoría atómica de cambios en canvas_entities

CREATE OR REPLACE FUNCTION fn_audit_canvas_entities()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Intentar obtener el user_id de la sesión (configurado vía SET LOCAL "app.current_user_id" = '...')
  BEGIN
    v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (project_id, user_id, entity_type, entity_id, action, payload_before, payload_after)
    VALUES (NEW.project_id, v_user_id, 'canvas_entity', NEW.id, 'INSERT', NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (project_id, user_id, entity_type, entity_id, action, payload_before, payload_after)
    VALUES (NEW.project_id, v_user_id, 'canvas_entity', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (project_id, user_id, entity_type, entity_id, action, payload_before, payload_after)
    VALUES (OLD.project_id, v_user_id, 'canvas_entity', OLD.id, 'DELETE', to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_canvas_changes ON canvas_entities;
CREATE TRIGGER trg_audit_canvas_changes
  AFTER INSERT OR UPDATE OR DELETE ON canvas_entities
  FOR EACH ROW EXECUTE FUNCTION fn_audit_canvas_entities();
