-- =============================================================
-- Migration 009 — Moindre privilège BD (Sprint 44)
-- À exécuter en tant que superuser (postgres) sur les bases
-- existantes qui ne bénéficient pas encore de l'init.sql mis à jour.
--
-- Usage :
--   docker exec -i smq_db psql -U postgres -d smq_db < migrations/009_least_privilege_user.sql
-- =============================================================

-- Créer l'utilisateur applicatif (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'smq_app') THEN
    CREATE USER smq_app WITH
      PASSWORD 'SmqApp@ACTIA_GED#2025!'
      LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
    RAISE NOTICE 'Utilisateur smq_app créé.';
  ELSE
    RAISE NOTICE 'Utilisateur smq_app déjà existant — mise à jour du mot de passe.';
    ALTER USER smq_app WITH PASSWORD 'SmqApp@ACTIA_GED#2025!';
  END IF;
END $$;

-- Révoquer les privilèges publics par défaut
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Droits de connexion et de schéma
GRANT CONNECT           ON DATABASE smq_db TO smq_app;
GRANT USAGE, CREATE     ON SCHEMA public   TO smq_app;

-- DML sur toutes les tables et séquences existantes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO smq_app;
GRANT USAGE, SELECT, UPDATE          ON ALL SEQUENCES IN SCHEMA public TO smq_app;

-- Droits automatiques sur les futures tables/séquences
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES    TO smq_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE          ON SEQUENCES TO smq_app;

-- Transférer la propriété (permet ALTER TABLE / CREATE INDEX au démarrage)
DO $body$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO smq_app', r.tablename);
  END LOOP;
  FOR r IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO smq_app', r.sequencename);
  END LOOP;
END $body$;

-- Vérification
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolcanlogin
  FROM pg_roles WHERE rolname = 'smq_app';
