import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geoRouter from "./geo";
import adminRouter from "./admin";
import meRouter from "./me";
import stripeRouter from "./stripe";
import authRouter from "./auth";
import contactRouter from "./contact";
import referralRouter from "./referral";
import crawlerPixelRouter from "./crawlerPixel";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(meRouter);
router.use(stripeRouter);
router.use(geoRouter);
router.use(adminRouter);
router.use(contactRouter);
router.use(referralRouter);
router.use(crawlerPixelRouter);

export default router;
