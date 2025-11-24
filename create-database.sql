-- Script pour créer la base de données project_management
-- À exécuter via pgAdmin ou psql

CREATE DATABASE "project_management"
    WITH 
    OWNER = zuno
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;