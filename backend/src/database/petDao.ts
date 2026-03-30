import { db } from './db';
import type { Pet } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function getAllPets(): Pet[] {
  const rows = db.prepare('SELECT * FROM pets ORDER BY created_at DESC').all() as any[];
  return rows.map(row => ({
    id: row.id as string,
    name: row.name as string,
    avatar: row.avatar as string,
    breed: row.breed as string,
    age: row.age as number,
    description: row.description as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string)
  }));
}

export function getPetById(id: string): Pet | undefined {
  const row: any = db.prepare('SELECT * FROM pets WHERE id = ?').get(id);
  if (!row) return undefined;
  return {
    id: row.id as string,
    name: row.name as string,
    avatar: row.avatar as string,
    breed: row.breed as string,
    age: row.age as number,
    description: row.description as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string)
  };
}

export function createPet(pet: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>): Pet {
  const id = uuidv4();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO pets (id, name, avatar, breed, age, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, pet.name, pet.avatar || null, pet.breed || null, pet.age || null, pet.description || null, now, now);
  return {
    id,
    ...pet,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

export function updatePet(id: string, pet: Partial<Pet>): Pet | undefined {
  const existing = getPetById(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE pets
    SET name = COALESCE(?, name),
        avatar = COALESCE(?, avatar),
        breed = COALESCE(?, breed),
        age = COALESCE(?, age),
        description = COALESCE(?, description),
        updated_at = ?
    WHERE id = ?
  `);
  stmt.run(pet.name || null, pet.avatar || null, pet.breed || null, pet.age || null, pet.description || null, now, id);
  return getPetById(id);
}

export function deletePet(id: string): boolean {
  const result = db.prepare('DELETE FROM pets WHERE id = ?').run(id);
  return result.changes > 0;
}
