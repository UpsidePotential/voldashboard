import express from 'express';
import { defaultRoute } from './defaultRoute';
import { futures } from './futures_sizes';
import { stockbond } from './stockbond';
import { vixbasisroute } from './vixbasis';
import { vixperation } from './vixperation';
import { vx30 } from './vx30';
import { vxCalendar } from './vxcalendar'
import { vixmega } from './vixmega'
import { tvauth } from './tvauth';
import { spxOptions } from './spxoptions';
import {drift} from './driftperps';

export const routes = express.Router();

routes.use(defaultRoute);
routes.use(vixbasisroute);
routes.use(vixperation);
routes.use(vx30);
routes.use(stockbond);
routes.use(futures);
routes.use(vxCalendar);
routes.use(vixmega);
routes.use(tvauth);
routes.use(spxOptions);
routes.use(drift)