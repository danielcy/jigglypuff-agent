import { Request, Response } from 'express';
import * as petDao from '../database/petDao';
import type { Pet } from '../types';

export function getAllPets(req: Request, res: Response) {
  try {
    const pets = petDao.getAllPets();
    res.json({
      code: 0,
      message: 'success',
      data: pets,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function getPetById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const pet = petDao.getPetById(id as string);
    if (!pet) {
      return res.status(404).json({
        code: 1,
        message: 'Pet not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: pet,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function createPet(req: Request, res: Response) {
  try {
    const petData = req.body;
    const pet = petDao.createPet(petData);
    res.status(201).json({
      code: 0,
      message: 'success',
      data: pet,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function updatePet(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const petData = req.body;
    const pet = petDao.updatePet(id as string, petData);
    if (!pet) {
      return res.status(404).json({
        code: 1,
        message: 'Pet not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: pet,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}

export function deletePet(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const success = petDao.deletePet(id as string);
    if (!success) {
      return res.status(404).json({
        code: 1,
        message: 'Pet not found',
      });
    }
    res.json({
      code: 0,
      message: 'success',
      data: { success: true },
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: (error as Error).message,
    });
  }
}
