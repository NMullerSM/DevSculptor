-- sp_project_metrics.sql
-- Función / Stored Procedure para cálculo atómico de métricas y maturity index de un proyecto

CREATE OR REPLACE FUNCTION sp_calculate_project_metrics(p_project_id UUID)
RETURNS TABLE (
  total_rf INT,
  total_rnf INT,
  total_entities INT,
  total_adrs_accepted INT,
  total_adrs_total INT,
  maturity_index INT
) AS $$
DECLARE
  v_rf INT := 0;
  v_rnf INT := 0;
  v_entities INT := 0;
  v_adrs_accepted INT := 0;
  v_adrs_total INT := 0;
  v_maturity INT := 0;
BEGIN
  -- Conteo de requisitos funcionales (RF)
  SELECT COUNT(*)::INT INTO v_rf
  FROM requirements
  WHERE project_id = p_project_id AND type = 'RF';

  -- Conteo de requisitos no funcionales (RNF)
  SELECT COUNT(*)::INT INTO v_rnf
  FROM requirements
  WHERE project_id = p_project_id AND type = 'RNF';

  -- Conteo de entidades en canvas
  SELECT COUNT(*)::INT INTO v_entities
  FROM canvas_entities
  WHERE project_id = p_project_id;

  -- Conteo de decisiones arquitectónicas aceptadas
  SELECT COUNT(*)::INT INTO v_adrs_accepted
  FROM architecture_decisions
  WHERE project_id = p_project_id AND status = 'ACCEPTED';

  -- Conteo total de decisiones arquitectónicas
  SELECT COUNT(*)::INT INTO v_adrs_total
  FROM architecture_decisions
  WHERE project_id = p_project_id;

  -- Cálculo de madurez documental ponderada (0 a 100)
  -- 25% por al menos 1 RF
  IF v_rf > 0 THEN
    v_maturity := v_maturity + 25;
  END IF;

  -- 25% por al menos 1 RNF
  IF v_rnf > 0 THEN
    v_maturity := v_maturity + 25;
  END IF;

  -- 25% por al menos 1 entidad de datos en canvas
  IF v_entities > 0 THEN
    v_maturity := v_maturity + 25;
  END IF;

  -- 25% por al menos 1 ADR aceptado
  IF v_adrs_accepted > 0 THEN
    v_maturity := v_maturity + 25;
  END IF;

  RETURN QUERY SELECT v_rf, v_rnf, v_entities, v_adrs_accepted, v_adrs_total, v_maturity;
END;
$$ LANGUAGE plpgsql;
