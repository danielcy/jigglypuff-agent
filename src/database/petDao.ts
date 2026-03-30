import { getStorage, setStorage } from './db';
import type { Pet } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function getAllPets(): Pet[] {
  return getStorage().pets;
}

export function getPetById(id: string): Pet | undefined {
  return getStorage().pets.find(p => p.id === id);
}

export function createPet(pet: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>): Pet {
  const newPet: Pet = {
    id: uuidv4(),
    ...pet,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const storage = getStorage();
  setStorage({
    pets: [...storage.pets, newPet],
  });
  return newPet;
}

export function updatePet(id: string, pet: Partial<Pet>): Pet | undefined {
  const storage = getStorage();
  const index = storage.pets.findIndex(p => p.id === id);
  if (index === -1) return undefined;
  const updatedPet = {
    ...storage.pets[index],
    ...pet,
    updatedAt: new Date(),
  };
  const newPets = [...storage.pets];
  newPets[index] = updatedPet;
  setStorage({
    pets: newPets,
  });
  return updatedPet;
}

export function deletePet(id: string): boolean {
  const storage = getStorage();
  const initialLength = storage.pets.length;
  const newPets = storage.pets.filter(p => p.id !== id);
  if (newPets.length === initialLength) return false;
  setStorage({
    pets: newPets,
  });
  return true;
}
