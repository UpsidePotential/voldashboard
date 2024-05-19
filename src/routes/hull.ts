import { Router } from 'express';
import { HullEntryModel } from '../hullModel';

export const hull = Router();

hull.get('/hull', async (req, res) => {

  const data = await HullEntryModel.find().exec()


  res.render('hull', {data});
})
