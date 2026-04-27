import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geoRouter from "./geo";
import adminRouter from "./admin";
import meRouter from "./me";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(stripeRouter);
router.use(geoRouter);
router.use(adminRouter);

export default router;
