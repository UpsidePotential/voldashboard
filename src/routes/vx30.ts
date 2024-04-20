import { Router } from 'express';
import { VX30MarketData } from '../vix';


export const vx30 = Router();

vx30.get('/vx30', async (req, res) => {

    const newData = await VX30MarketData();
    res.render('vx30', {data: {vx30: newData}});
})
