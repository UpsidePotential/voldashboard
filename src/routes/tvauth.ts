import { Router } from 'express';


export const tvauth = Router();

tvauth.get('/tvauth', async (req, res) => {
    await req.app.locals.marketData.login()
    res.json({});
});