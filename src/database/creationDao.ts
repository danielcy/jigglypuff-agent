import { getStorage, setStorage } from './db';
import type { Creation } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function getAllCreations(): Creation[] {
  return getStorage().creations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function getCreationById(id: string): Creation | undefined {
  return getStorage().creations.find(c => c.id === id);
}

export function createCreation(creation: Omit<Creation, 'id' | 'createdAt' | 'updatedAt'>): Creation {
  const newCreation: Creation = {
    id: uuidv4(),
    ...creation,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const storage = getStorage();
  setStorage({
    creations: [...storage.creations, newCreation],
  });
  return newCreation;
}

export function updateCreation(id: string, creation: Partial<Creation>): Creation | undefined {
  const storage = getStorage();
  const index = storage.creations.findIndex(c => c.id === id);
  if (index === -1) return undefined;
  const updatedCreation = {
    ...storage.creations[index],
    ...creation,
    updatedAt: new Date(),
  };
  const newCreations = [...storage.creations];
  newCreations[index] = updatedCreation;
  setStorage({
    creations: newCreations,
  });
  return updatedCreation;
}

export function deleteCreation(id: string): boolean {
  const storage = getStorage();
  const initialLength = storage.creations.length;
  const newCreations = storage.creations.filter(c => c.id !== id);
  if (newCreations.length === initialLength) return false;
  setStorage({
    creations: newCreations,
  });
  return true;
}
