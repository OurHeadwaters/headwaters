import { Router, type IRouter } from "express";
import healthRouter from "./health";
import episodesRouter from "./episodes";
import libraryRouter from "./library";

const router: IRouter = Router();

router.use(healthRouter);
router.use(episodesRouter);
router.use(libraryRouter);

export default router;
