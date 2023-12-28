import { Router } from 'express';
import { VXEntryModel } from '../vxModel'
import { buildVXData, FuturesContract} from '../vix';


export const vx30 = Router();

vx30.get('/vx30', async (req, res) => {
    const vx_sum = await VXEntryModel.find().exec()

    const newData = await buildVXData(req.app.locals.marketData, vx_sum);

    const data = vx_sum.map( value => {
       return [new Date(value.date).getTime(), Number(value.premium_zscore)];
    });

    res.render('vx30', {data: {latest: newData, historical: data.slice(data.length-300)} });
})
