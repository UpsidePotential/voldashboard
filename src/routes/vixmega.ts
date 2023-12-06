import { Router } from 'express';
import got from 'got';

export const vixmega = Router();

vixmega.get('/vixmega', async (req, res) => {
    
    const rvolData = await got(`${process.env.DASHBOARD_URL}/vixmultistrat`);
    const vixmegadata = JSON.parse(rvolData.body);

    res.render('vixmega', {data: { latest: vixmegadata.data[vixmegadata.data.length-1] }});
})
