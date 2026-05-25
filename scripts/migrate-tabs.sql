-- =====================================================================
-- Run this once in Supabase Dashboard → SQL Editor (project: ifektldzqibwsjlwxmin)
-- Adds tab support (Cuestionario + Pipeline) to the existing Client table.
-- Safe to re-run: every statement uses IF NOT EXISTS / IF EXISTS guards.
-- =====================================================================

ALTER TABLE "Client"
  ADD COLUMN IF NOT EXISTS "questionnaireType"        TEXT,
  ADD COLUMN IF NOT EXISTS "questionnaireAnswers"     JSONB,
  ADD COLUMN IF NOT EXISTS "questionnaireSubmittedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "pipelineHtml"             TEXT;

-- Turn on the Cuestionario + Pipeline tabs for the Kinecenter client.
-- Token is case-insensitive (ilike). Pipeline HTML is a starter placeholder you
-- can later overwrite from the /admin panel.
UPDATE "Client"
SET
  "questionnaireType" = COALESCE("questionnaireType", 'kinecenter'),
  "pipelineHtml"      = COALESCE(
    "pipelineHtml",
    '<section class="pipeline-empty"><h2>Pipeline en preparación</h2><p>Aquí verás el avance del proyecto Kinecenter (rodajes, entregas, KPIs) en cuanto el cuestionario esté respondido. Pronto disponible.</p></section>'
  )
WHERE LOWER("token") = LOWER('Kine-0123');

-- Verify (camelCase column names MUST be quoted, otherwise Postgres
-- lowercases the identifier and complains "column does not exist").
SELECT
  token,
  name,
  ("questionnaireType"    IS NOT NULL) AS has_questionnaire,
  ("questionnaireAnswers" IS NOT NULL) AS questionnaire_answered,
  ("pipelineHtml"         IS NOT NULL) AS has_pipeline
FROM "Client";
