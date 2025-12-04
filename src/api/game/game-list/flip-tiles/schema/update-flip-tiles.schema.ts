import z from 'zod';

import {
  fileSchema,
  StringToBooleanSchema,
  StringToObjectSchema,
} from '@/common';

import { TileSchema } from './create-flip-tiles.schema';

export const UpdateFlipTilesSchema = z.object({
  name: z.string().max(128).trim().optional(),
  description: z.string().max(256).trim().optional(),
  thumbnail_image: fileSchema({}).optional(),
  game_template_slug: z.string().optional(),
  is_published: StringToBooleanSchema.optional(),
  game_json: StringToObjectSchema(
    z.object({
      tiles: z.array(TileSchema).min(1).max(100),
    }),
  ).optional(),
});

export type IUpdateFlipTiles = z.infer<typeof UpdateFlipTilesSchema>;
