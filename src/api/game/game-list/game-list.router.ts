/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-default-export */
import { Router } from 'express';

import { FlipTilesController } from './flip-tiles/flip-tiles.controller';
import { QuizController } from './quiz/quiz.controller';

const GameListRouter = Router();

GameListRouter.use('/flip-tiles', FlipTilesController);
GameListRouter.use('/quiz', QuizController);

export default GameListRouter;
