/*
# Add username column to colaboradores

## Overview
Adds a `username` column to the `colaboradores` table so each collaborator
has an explicit login handle (e.g. "francisco.neto") alongside their
display name and job title. This makes the user-creation form and the
dynamic header fully data-driven.

## Changes
1. New column: `colaboradores.username` (text, unique)
2. Backfill the existing admin row with username 'francisco.neto'
3. Update the cargo of the existing admin to 'Eng. Civil'
4. Add a unique index on username to prevent duplicates

## Security
- No RLS policy changes. Existing policies still apply.
*/

ALTER TABLE colaboradores
  ADD COLUMN IF NOT EXISTS username text;

UPDATE colaboradores
  SET username = 'francisco.neto', cargo = 'Eng. Civil'
  WHERE nome = 'Francisco Neto' AND username IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_colaboradores_username
  ON colaboradores (username)
  WHERE username IS NOT NULL;
