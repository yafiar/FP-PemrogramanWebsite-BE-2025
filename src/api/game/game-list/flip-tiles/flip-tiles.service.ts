import { ROLE } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';

import { ErrorResponse, prisma } from '@/common';
import { FileManager } from '@/utils';

import { ICreateFlipTiles, IUpdateFlipTiles } from './schema';

export abstract class FlipTilesService {
  private static readonly FLIP_TILES_SLUG = 'flip-tiles';

  // =============================
  // CREATE
  // =============================
  static async createFlipTiles(
    data: ICreateFlipTiles,
    creator_id: string,
  ) {
    try {
      return await prisma.$transaction(async tx => {
        // 1. Check duplicate name
        const existByName = await tx.games.findUnique({
          where: { name: data.title },
          select: { id: true },
        });

        if (existByName) {
          throw new ErrorResponse(
            StatusCodes.BAD_REQUEST,
            'Game name is already used',
          );
        }

        // 2. Get game template
        const gameTemplate = await tx.gameTemplates.findFirst({
          where: { slug: this.FLIP_TILES_SLUG },
        });

        if (!gameTemplate) {
          throw new ErrorResponse(
            StatusCodes.NOT_FOUND,
            'Flip Tiles game template not found',
          );
        }

        // 3. Validate thumbnail
        if (!data.thumbnail) {
          throw new ErrorResponse(
            StatusCodes.BAD_REQUEST,
            'Thumbnail is required',
          );
        }

        const newGameId = uuidv4();

        // 4. Upload thumbnail
        const thumbnailImagePath = await FileManager.upload(
          `game/flip-tiles/${newGameId}`,
          data.thumbnail,
        );

        // 5. Create game
        const newGame = await tx.games.create({
          data: {
            id: newGameId,
            name: data.title,
            description: data.description ?? '',
            creator_id,
            game_template_id: gameTemplate.id,
            thumbnail_image: thumbnailImagePath,
            game_json: {
              tiles: data.tiles ?? [],
            },
          } as any,
        });

        return newGame;
      });
    } catch (error) {
      if (error instanceof ErrorResponse) throw error;

      console.error('[CREATE FLIP TILES ERROR]', error);

      throw new ErrorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to create Flip Tiles game',
      );
    }
  }

  // =============================
  // DETAIL
  // =============================
  static async getFlipTilesDetail(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    try {
      const game = await prisma.games.findUnique({
        where: { id: game_id },
        include: { game_template: true },
      });

      if (!game) {
        throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
      }

      if (
        !game.game_template ||
        game.game_template.slug !== this.FLIP_TILES_SLUG
      ) {
        throw new ErrorResponse(
          StatusCodes.BAD_REQUEST,
          'Game is not a Flip Tiles game',
        );
      }

      // Authorization
      if (user_role !== ROLE.SUPER_ADMIN && game.creator_id !== user_id) {
        throw new ErrorResponse(
          StatusCodes.FORBIDDEN,
          'You are not authorized to access this game',
        );
      }

      return {
        id: game.id,
        title: game.name,
        description: game.description,
        thumbnail_image: game.thumbnail_image,
        is_published: game.is_published,
        tiles: (game.game_json as { tiles: any[] })?.tiles ?? [],
      };
    } catch (error) {
      if (error instanceof ErrorResponse) throw error;

      console.error('[GET FLIP TILES ERROR]', error);

      throw new ErrorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to get Flip Tiles game',
      );
    }
  }

  // =============================
  // UPDATE
  // =============================
  static async updateFlipTiles(
    data: IUpdateFlipTiles,
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    try {
      return await prisma.$transaction(async tx => {
        const game = await tx.games.findUnique({
          where: { id: game_id },
          include: { game_template: true },
        });

        if (!game) {
          throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
        }

        if (
          !game.game_template ||
          game.game_template.slug !== this.FLIP_TILES_SLUG
        ) {
          throw new ErrorResponse(
            StatusCodes.BAD_REQUEST,
            'Game is not a Flip Tiles game',
          );
        }

        // Authorization
        if (user_role !== ROLE.SUPER_ADMIN && game.creator_id !== user_id) {
          throw new ErrorResponse(
            StatusCodes.FORBIDDEN,
            'You are not authorized to update this game',
          );
        }

        const updateData: any = {};

        if (data.title) updateData.name = data.title;
        if (data.description !== undefined)
          updateData.description = data.description;

        if (data.tiles) {
          updateData.game_json = {
            tiles: data.tiles,
          };
        }

        if (data.thumbnail) {
          if (game.thumbnail_image) {
            await FileManager.remove(game.thumbnail_image);
          }

          const thumbnailImagePath = await FileManager.upload(
            `game/flip-tiles/${game_id}`,
            data.thumbnail,
          );

          updateData.thumbnail_image = thumbnailImagePath;
        }

        return await tx.games.update({
          where: { id: game_id },
          data: updateData,
        });
      });
    } catch (error) {
      if (error instanceof ErrorResponse) throw error;

      console.error('[UPDATE FLIP TILES ERROR]', error);

      throw new ErrorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to update Flip Tiles game',
      );
    }
  }

  // =============================
  // DELETE
  // =============================
  static async deleteFlipTiles(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    try {
      return await prisma.$transaction(async tx => {
        const game = await tx.games.findUnique({
          where: { id: game_id },
          include: { game_template: true },
        });

        if (!game) {
          throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
        }

        if (
          !game.game_template ||
          game.game_template.slug !== this.FLIP_TILES_SLUG
        ) {
          throw new ErrorResponse(
            StatusCodes.BAD_REQUEST,
            'Game is not a Flip Tiles game',
          );
        }

        // Authorization
        if (user_role !== ROLE.SUPER_ADMIN && game.creator_id !== user_id) {
          throw new ErrorResponse(
            StatusCodes.FORBIDDEN,
            'You are not authorized to delete this game',
          );
        }

        if (game.thumbnail_image) {
          await FileManager.remove(game.thumbnail_image);
        }

        await tx.games.delete({
          where: { id: game_id },
        });

        return { message: 'Flip Tiles game deleted successfully' };
      });
    } catch (error) {
      if (error instanceof ErrorResponse) throw error;

      console.error('[DELETE FLIP TILES ERROR]', error);

      throw new ErrorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to delete Flip Tiles game',
      );
    }
  }
}
