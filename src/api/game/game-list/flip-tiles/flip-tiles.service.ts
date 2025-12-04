import { type Prisma, type ROLE } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';

import { ErrorResponse, prisma } from '@/common';
import { FileManager } from '@/utils';

import { type ICreateFlipTiles, type IUpdateFlipTiles } from './schema';

export interface IFlipTilesJson {
  tiles: Array<{
    label: string;
  }>;
}

export abstract class FlipTilesService {
  private static readonly flipTilesSlug = 'flip-tiles';

  static async createFlipTiles(data: ICreateFlipTiles, user_id: string) {
    await this.existGameCheck(data.name);

    const newFlipTilesId = v4();
    const flipTilesTemplateId = await this.getGameTemplateId();

    const thumbnailImagePath = await FileManager.upload(
      `game/flip-tiles/${newFlipTilesId}`,
      data.thumbnail_image,
    );

    const flipTilesJson: IFlipTilesJson = {
      tiles: data.game_json.tiles,
    };

    const newGame = await prisma.games.create({
      data: {
        id: newFlipTilesId,
        game_template_id: flipTilesTemplateId,
        creator_id: user_id,
        name: data.name,
        description: data.description,
        thumbnail_image: thumbnailImagePath,
        is_published: data.is_published,
        game_json: flipTilesJson as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });

    return newGame;
  }

  static async getFlipTilesGameDetail(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        created_at: true,
        game_json: true,
        creator_id: true,
        total_played: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.flipTilesSlug)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot access this game',
      );

    return {
      ...game,
      creator_id: undefined,
      game_template: undefined,
    };
  }

  static async updateFlipTiles(
    data: IUpdateFlipTiles,
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        game_json: true,
        creator_id: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.flipTilesSlug)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot access this game',
      );

    if (data.name) {
      const isNameExist = await prisma.games.findUnique({
        where: { name: data.name },
        select: { id: true },
      });

      if (isNameExist && isNameExist.id !== game_id)
        throw new ErrorResponse(
          StatusCodes.BAD_REQUEST,
          'Game name is already used',
        );
    }

    let thumbnailImagePath = game.thumbnail_image;

    if (data.thumbnail_image) {
      if (game.thumbnail_image) {
        await FileManager.remove(game.thumbnail_image);
      }

      thumbnailImagePath = await FileManager.upload(
        `game/flip-tiles/${game_id}`,
        data.thumbnail_image,
      );
    }

    const oldFlipTilesJson = game.game_json as IFlipTilesJson | null;

    const flipTilesJson: IFlipTilesJson = {
      tiles: data.game_json?.tiles ?? oldFlipTilesJson?.tiles ?? [],
    };

    const updatedGame = await prisma.games.update({
      where: { id: game_id },
      data: {
        name: data.name ?? game.name,
        description: data.description ?? game.description,
        thumbnail_image: thumbnailImagePath,
        is_published: data.is_published ?? game.is_published,
        game_json: flipTilesJson as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });

    return {
      ...updatedGame,
      creator_id: undefined,
    };
  }

  private static async existGameCheck(name: string) {
    const existGame = await prisma.games.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existGame)
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Game name is already used',
      );
  }

  private static async getGameTemplateId() {
    const gameTemplate = await prisma.gameTemplates.findUnique({
      where: { slug: this.flipTilesSlug },
      select: { id: true },
    });

    if (!gameTemplate)
      throw new ErrorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Game template not found',
      );

    return gameTemplate.id;
  }
}
