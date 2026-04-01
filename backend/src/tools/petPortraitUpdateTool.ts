import { BaseTool } from './baseTool';
import type { Creation } from '../types';
import { getPetById, updatePet, searchPetsByName } from '../database/petDao';
import type { Pet } from '../types';

/**
 * Update the AI portrait summary for a pet.
 * Agent can update the portrait when new information about the pet is provided in conversation.
 * The portrait should be a concise summary (100-200 words) that includes:
 * - personality traits
 * - appearance characteristics
 * - unique habits or characteristics
 * - what makes this pet special
 */
export class PetPortraitUpdateTool extends BaseTool {
  name = 'pet_portrait_update';
  description = "Update the AI portrait summary for a pet. Use this when you learn new information about the pet from the user that should be added to the pet's persistent profile. Keep the summary concise (100-200 words).";

  inputSchema = {
    type: 'object',
    properties: {
      petId: {
        type: 'string',
        description: 'ID or name of the pet to update (supports both exact ID and name matching)',
      },
      portrait: {
        type: 'string',
        description: 'Concise AI portrait summary (100-200 words) including personality, appearance, habits, and what makes this pet special',
      },
    },
    required: ['petId', 'portrait'],
  };

  async execute(args: {
    petId: string;
    portrait: string;
  }, creation: Creation): Promise<{ petId: string; petName: string; portrait: string; success: boolean }> {
    const { petId, portrait } = args;

    if (!petId || typeof petId !== 'string') {
      throw new Error('petId is required and must be a string');
    }
    if (!portrait || typeof portrait !== 'string') {
      throw new Error('portrait is required and must be a string');
    }

    // First try to find by exact ID
    let pet: Pet | undefined = getPetById(petId);
    let foundPetId = petId;

    // If not found by ID, try to search by name
    if (!pet) {
      const matchedPets = searchPetsByName(petId);
      if (matchedPets.length === 0) {
        throw new Error(`No pet found matching '${petId}' (tried both ID and name)`);
      }
      if (matchedPets.length > 1) {
        const names = matchedPets.map(p => `${p.name} (ID: ${p.id})`).join(', ');
        throw new Error(`Multiple pets matching '${petId}': ${names}. Please specify the exact pet or use the pet ID.`);
      }
      // Found exactly one match by name
      pet = matchedPets[0];
      foundPetId = pet.id;
    }

    const updated = updatePet(foundPetId, { portrait });
    if (!updated) {
      throw new Error(`Failed to update pet '${petId}'`);
    }

    return {
      petId: foundPetId,
      petName: pet.name,
      portrait,
      success: true,
    };
  }
}
