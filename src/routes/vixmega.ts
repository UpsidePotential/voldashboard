import { Router } from 'express';
import { VXEntryModel } from '../vxModel';
import { buildVXData, getNumberOfDays, getVXFuturesData } from '../vix';

export const vixmega = Router();

vixmega.get('/vixmega', async (req, res) => {
    
    const vxContracts = (await getVXFuturesData()).filter((x: any) => x.last_price > 0);

    const vxPrices = vxContracts.map( (contract: any) => {
      return [Date.parse(contract.expiration), contract.last_price]
    });
  
    const vx_sum = await VXEntryModel.find().exec()

    const newData = await buildVXData(req.app.locals.marketData, vx_sum);
    {
      const date = new Date()
      date.setDate(date.getDate() + 30);
      vxPrices.splice(1,0,[date.valueOf(),newData.vx30 ]);
    }
    
    // need to sort the vx futures by experation date.

    const vxFuturesData = vxContracts.map( (value: any) => {
      const exp = new Date(value.expiration)

      return {
        symbol: value.symbol,
        experation: exp.toLocaleDateString(),
        dte: getNumberOfDays(new Date(), exp),
        change: value.change,
        oi: value.prev_open_int,
        volume: value.volume
      }
    })

    const data = vx_sum.map( value => {
      return [new Date(value.date).getTime(), Number(value.premium_zscore)];
   });


   // res.render('vixmega', {data: { latest: vixmegadata.data[vixmegadata.data.length-1] }});
})
