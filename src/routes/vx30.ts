import { Router } from 'express';
import { LiveData, VX30MarketData } from '../vix';


export const vx30 = Router();

vx30.get('/vx30', async (req, res) => {

    const livemarketdata = await LiveData();
    const newData = await VX30MarketData();

    function convertTime(time: any) {
        // Check if the time is already in milliseconds
        if (time.toString().length === 13) {
          return new Date(time);
        } else {
          // Convert seconds to milliseconds
          return new Date(time * 1000);
        }
      }

    const dataArray = Object.keys(livemarketdata).map(symbol => ({
        symbol,
        close: livemarketdata[symbol].close,
        time: convertTime(livemarketdata[symbol].time)
      }));

    res.render('vx30', {data: {vx30: newData, livedata: dataArray}});
})
