import { Router } from 'express';
import NodeCache from 'node-cache'

import { premiumZscore, getNumberOfDays, SPXRealizedVol, SPXVRP, vixbasis, getVXFuturesData, getVIXData, VixTsunami, VX30MarketData, LiveData, convertContractNameTW } from "../vix"

export const defaultRoute = Router();

defaultRoute.get('/', async (req, res) => {
    const vxContracts = (await getVXFuturesData()).filter((x: any) => x.last_price > 0);

    const livemarketdata = await LiveData();
    console.log(livemarketdata)
    const vxPrices = vxContracts.map( (contract: any) => {
      // replace prices with these more correct ones
      const twSymbolName = convertContractNameTW(contract.symbol)
      if(livemarketdata.hasOwnProperty(twSymbolName))
      {
        return [Date.parse(contract.expiration), Number(livemarketdata[twSymbolName].close)]
      }

      return [Date.parse(contract.expiration), contract.last_price]
      
    });

    const nodeCache = (req.app.locals.nodeCache as NodeCache);
    let vxdata: any = nodeCache.get('vxdata');
    if (vxdata == undefined) {
      vxdata = await VX30MarketData();
      nodeCache.set('vxdata', vxdata, 10800);
    }
    
    // need to sort the vx futures by experation date.

    const vxFuturesData = vxContracts.map( (value: any) => {
      const exp = new Date(value.expiration)

      return {
        symbol: value.symbol,
        twSymbol: convertContractNameTW(value.symbol),
        experation: exp.toLocaleDateString(),
        dte: getNumberOfDays(new Date(), exp),
        change: value.change,
        oi: value.prev_open_int,
        volume: value.volume
      }
    })

    const data = vxdata.map( (value: any) => {
      return [new Date(value['Trade Date']).getTime(), Number(value.VX30_Premium_zscore_Close)];
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
  latest = vxdata[vxdata.length -1];
  latest.ivts = vixBasis.ivts[vixBasis.ivts.length -1 ][1];
  latest.vvol = vixBasis.vvol[vixBasis.vvol.length -1 ][1];

  // update vx30 to use weightings and livedata
  const vx1Price = livemarketdata[vxFuturesData[0].twSymbol].close
  const vx2Price = livemarketdata[vxFuturesData[1].twSymbol].close

  latest.premium_zscore = premiumZscore(latest,vx1Price, vx2Price, livemarketdata.VIX3M.close)
  latest.vx30 = (vx1Price * latest['Front Month Weight']) + (vx2Price * latest['Next Month Weight']);
  latest.VIX = Number(livemarketdata.VIX.close)
  latest.VIX3M = Number(livemarketdata.VIX3M.close)
  latest.premium = Number(latest.vx30/latest.VIX3M)

    res.render('index', {data: {prices: vxPrices, vxFuturesData, latest, historical: data, rvol, vrp, vixBasis, spxIVols, livemarketdata }});
});
