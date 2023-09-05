import { Router } from 'express';
import yahooFinance from 'yahoo-finance2'; 
import { vixbasis} from '../vix';

export const vixbasisroute = Router();

vixbasisroute.get('/vixbasis', async (req, res) => {
    
    const vixBasis = await vixbasis();

    const vix = (await yahooFinance.quote('^VIX')).regularMarketPrice;
    const vix3m = (await yahooFinance.quote('^VIX3M')).regularMarketPrice;

    const ivts = vixBasis.ivts[vixBasis.ivts.length -1 ][1];
    const vvol = vixBasis.vvol[vixBasis.vvol.length -1 ][1];


    res.render('vixbasis', {data: {vixBasis, vix, vix3m, ivts, vvol }});
})
