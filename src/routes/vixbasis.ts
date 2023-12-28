import { Router } from 'express';
import { vixbasis} from '../vix';

export const vixbasisroute = Router();

vixbasisroute.get('/vixbasis', async (req, res) => {
    
    const vixBasis = await vixbasis();

    const vix = req.app.locals.marketData.latestQuote('CBOE:VIX').value;
    const vix3m = req.app.locals.marketData.latestQuote('CBOE:VIX3M').value;

    const ivts = vixBasis.ivts[vixBasis.ivts.length -1 ][1];
    const vvol = vixBasis.vvol[vixBasis.vvol.length -1 ][1];


    res.render('vixbasis', {data: {vixBasis, vix, vix3m, ivts, vvol }});
})
