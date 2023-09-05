import { Router } from 'express';

import { buildVXData, getNumberOfDays, SPXRealizedVol, SPXVRP, vixbasis, getVXFuturesData, getVIXData } from "../vix"
import { VXEntryModel } from '../vxModel';

export const defaultRoute = Router();

defaultRoute.get('/', async (req, res) => {
    const vxContracts = (await getVXFuturesData()).filter((x: any) => x.last_price > 0);

    const vxPrices = vxContracts.map( (contract: any) => {
      return [Date.parse(contract.expiration), contract.last_price]
    });
  
    const vx_sum = await VXEntryModel.find().exec()

    const newData = await buildVXData(vx_sum);
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

   const rvol = await SPXRealizedVol();
   const vrp = await SPXVRP();
   const vixBasis = await vixbasis();

   const spxVixData = await getVIXData();
   const spxIVols = spxVixData.map( (x:any) => {
    return [ x.symbol, x.price ]
   });
   // create a chart that has both VX futures and SPX ivol
   // need to normalize the dates such that vx looks 30 days into spxIvol





  let latest: any;
  latest = newData;
  latest.ivts = vixBasis.ivts[vixBasis.ivts.length -1 ][1];
  latest.vvol = vixBasis.vvol[vixBasis.vvol.length -1 ][1];

    res.render('index', {data: {prices: vxPrices, vxFuturesData, latest, historical: data.slice(data.length-300), rvol, vrp, vixBasis, spxIVols }});
});
