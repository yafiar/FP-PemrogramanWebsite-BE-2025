import { z } from 'zod';
import { fileSchema } from '@/common';

const TileSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Label is required'),
  color: z.string().min(1, 'Color is required'),
});

export const CreateFlipTilesSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  thumbnail: fileSchema({}),
  tiles: z
    .string()
    .transform((val) => JSON.parse(val))
    .pipe(z.array(TileSchema).min(2, 'At least 2 tiles are required')),
});

export const UpdateFlipTilesSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  thumbnail: fileSchema({}).optional(),
  tiles: z
    .string()
    .transform((val) => JSON.parse(val))
    .pipe(z.array(TileSchema).min(2, 'At least 2 tiles are required'))
    .optional(),
});

export type ICreateFlipTiles = z.infer<typeof CreateFlipTilesSchema>;
export type IUpdateFlipTiles = z.infer<typeof UpdateFlipTilesSchema>;
