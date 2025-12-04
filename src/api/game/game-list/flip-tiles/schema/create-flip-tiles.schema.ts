import z from 'zod';

import {
  fileSchema,
  StringToBooleanSchema,
  StringToObjectSchema,
} from '@/common';

export const TileSchema = z.object({
  label: z.string().max(256).trim(),
});

export const CreateFlipTilesSchema = z.object({
  name: z.string().max(128).trim(),
  description: z.string().max(256).trim().optional(),
  thumbnail_image: fileSchema({}),
  game_template_slug: z.string().default('flip-tiles'),
  is_published: StringToBooleanSchema.default(false),
  game_json: StringToObjectSchema(
    z.object({
      tiles: z.array(TileSchema).min(1).max(100),
    }),
  ),
});

export type ICreateFlipTiles = z.infer<typeof CreateFlipTilesSchema>;
