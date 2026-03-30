import { getStorage, setStorage } from './db';
import type { Material } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function getAllMaterials(): Material[] {
  return getStorage().materials;
}

export function searchMaterials(keyword: string, tags?: string[]): Material[] {
  let materials = getStorage().materials;

  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    materials = materials.filter(
      m =>
        m.title.toLowerCase().includes(lowerKeyword) ||
        (m.description && m.description.toLowerCase().includes(lowerKeyword))
    );
  }

  if (tags && tags.length > 0) {
    materials = materials.filter(m =>
      tags.every(tag => m.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())))
    );
  }

  return materials.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getMaterialById(id: string): Material | undefined {
  return getStorage().materials.find(m => m.id === id);
}

export function createMaterial(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Material {
  const newMaterial: Material = {
    id: uuidv4(),
    ...material,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const storage = getStorage();
  setStorage({
    materials: [...storage.materials, newMaterial],
  });
  return newMaterial;
}

export function updateMaterial(id: string, material: Partial<Material>): Material | undefined {
  const storage = getStorage();
  const index = storage.materials.findIndex(m => m.id === id);
  if (index === -1) return undefined;
  const updatedMaterial = {
    ...storage.materials[index],
    ...material,
    updatedAt: new Date(),
  };
  const newMaterials = [...storage.materials];
  newMaterials[index] = updatedMaterial;
  setStorage({
    materials: newMaterials,
  });
  return updatedMaterial;
}

export function deleteMaterial(id: string): boolean {
  const storage = getStorage();
  const initialLength = storage.materials.length;
  const newMaterials = storage.materials.filter(m => m.id !== id);
  if (newMaterials.length === initialLength) return false;
  setStorage({
    materials: newMaterials,
  });
  return true;
}
