import { Router, type IRouter } from "express";
import healthRouter from "./health";
import episodesRouter from "./episodes";
import libraryRouter from "./library";
import seriesRouter from "./series";
import zonesRouter from "./zones";

const router: IRouter = Router();

router.use(healthRouter);
router.use(episodesRouter);
router.use(libraryRouter);
router.use(seriesRouter);
router.use(zonesRouter);

export default router;
