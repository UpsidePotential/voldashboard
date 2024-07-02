import { Router } from 'express';
import got from 'got'

export const bonds = Router();

bonds.get('/bonds', async (req, res) => {
    let flowstrats = {}
    try {
         const res = await got(`${process.env.DASHBOARD_URL}/flowstrats`)
         flowstrats = JSON.parse(res.body);
    } catch (e) {
        console.error(e)
    }
   
    res.render('bonds', {data: {flowstrats}});
})
