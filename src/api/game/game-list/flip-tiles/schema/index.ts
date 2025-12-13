import { z } from 'zod';
import { fileSchema } from '@/common';

const TileSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Label is required'),
  color: z.string().min(1, 'Color is required'),
});

// Accept either stringified JSON array or direct array input for tiles
const TilesInput = z
  .union([
    z
      .string()
      .transform((val) => JSON.parse(val))
      .pipe(z.array(TileSchema)),
    z.array(TileSchema),
  ])
  .refine((arr) => arr.length >= 2, {
    message: 'At least 2 tiles are required',
  });

export const CreateFlipTilesSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  thumbnail: fileSchema({}),
  tiles: TilesInput,
});

export const UpdateFlipTilesSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  thumbnail: fileSchema({}).optional(),
  tiles: TilesInput.optional(),
});

export type ICreateFlipTiles = z.infer<typeof CreateFlipTilesSchema>;
export type IUpdateFlipTiles = z.infer<typeof UpdateFlipTilesSchema>;
