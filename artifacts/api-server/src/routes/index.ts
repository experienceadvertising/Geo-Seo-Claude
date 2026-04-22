import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geoRouter from "./geo";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geoRouter);
router.use(adminRouter);

export default router;
