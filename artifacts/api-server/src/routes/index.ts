import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import episodesRouter from "./episodes";
import libraryRouter from "./library";
import seriesRouter from "./series";
import zonesRouter from "./zones";
import expertsRouter from "./experts";
import tracksRouter from "./tracks";
import transformationsRouter from "./transformations";
import adminCategoriesRouter from "./admin-categories";
import trackProgressRouter from "./track-progress";
import adminCouncilRouter from "./admin-council";
import wishingWellRouter from "./wishing-well";
import v4vRouter from "./v4v";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(episodesRouter);
router.use(libraryRouter);
router.use(seriesRouter);
router.use(zonesRouter);
router.use(expertsRouter);
router.use(tracksRouter);
router.use(transformationsRouter);
router.use(adminCategoriesRouter);
router.use(trackProgressRouter);
router.use(adminCouncilRouter);
router.use(wishingWellRouter);
router.use(v4vRouter);

export default router;
