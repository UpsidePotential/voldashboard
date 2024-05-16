import { Router } from 'express';
import { sentimentMeter,marketPositioning } from '../hulltactical';

export const hull = Router();

hull.get('/hull', async (req, res) => {

  const sentiment = await sentimentMeter();
  const positioning = await marketPositioning();


    res.json({sentiment, positioning})
})
