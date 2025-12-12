import {
  type NextFunction,
  type Response,
  Router,
} from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  type AuthedRequest,
  SuccessResponse,
  validateAuth,
  validateBody,
} from '@/common';

import { FlipTilesService } from './flip-tiles.service';
import {
  CreateFlipTilesSchema,
  type ICreateFlipTiles,
  type IUpdateFlipTiles,
  UpdateFlipTilesSchema,
} from './schema';

export const FlipTilesController = Router()
  .post(
    '/',
    validateAuth({}),
    validateBody({
      schema: CreateFlipTilesSchema,
      file_fields: [{ name: 'thumbnail', maxCount: 1 }],
    }),
    async (
      request: AuthedRequest<{}, {}, ICreateFlipTiles>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const newGame = await FlipTilesService.createFlipTiles(
          request.body,
          request.user!.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Flip Tiles game created successfully',
          newGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await FlipTilesService.getFlipTilesDetail(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get Flip Tiles game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .patch(
    '/:game_id',
    validateAuth({}),
    validateBody({
      schema: UpdateFlipTilesSchema,
      file_fields: [{ name: 'thumbnail', maxCount: 1 }],
    }),
    async (
      request: AuthedRequest<{ game_id: string }, {}, IUpdateFlipTiles>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const updatedGame = await FlipTilesService.updateFlipTiles(
          request.body,
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Flip Tiles game updated successfully',
          updatedGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .delete(
    '/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result = await FlipTilesService.deleteFlipTiles(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );

        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          'Flip Tiles game deleted successfully',
          result,
        );

        return response
          .status(successResponse.statusCode)
          .json(successResponse.json());
      } catch (error) {
        return next(error);
      }
    },
  );
