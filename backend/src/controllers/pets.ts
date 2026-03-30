import { Request, Response } from 'express';
import * as petDao from '../database/petDao';
import type { Pet } from '../types';

export function getAllPets(req: Request, res: Response) {
  const pets = petDao.getAllPets();
  res.json(pets);
}

export function getPetById(req: Request, res: Response) {
  const { id } = req.params;
  const pet = petDao.getPetById(id as string);
  if (!pet) {
    return res.status(404).json({ error: 'Pet not found' });
  }
  res.json(pet);
}

export function createPet(req: Request, res: Response) {
  const petData = req.body;
  const pet = petDao.createPet(petData);
  res.status(201).json(pet);
}

export function updatePet(req: Request, res: Response) {
  const { id } = req.params;
  const petData = req.body;
  const pet = petDao.updatePet(id as string, petData);
  if (!pet) {
    return res.status(404).json({ error: 'Pet not found' });
  }
  res.json(pet);
}

export function deletePet(req: Request, res: Response) {
  const { id } = req.params;
  const success = petDao.deletePet(id as string);
  if (!success) {
    return res.status(404).json({ error: 'Pet not found' });
  }
  res.json({ success: true });
}
