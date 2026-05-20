import { Router, type IRouter } from "express";
import healthRouter from "./health";
import episodesRouter from "./episodes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(episodesRouter);

export default router;
