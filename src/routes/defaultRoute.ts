import { Router } from 'express';
import NodeCache from 'node-cache'

import { premiumZscore, getNumberOfDays, SPXRealizedVol, SPXVRP, vixbasis, getVXFuturesData, getVIXData, VixTsunami, VX30MarketData, LiveData, convertContractNameTW, VX30RollData } from "../vix"

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

   
    const vxdata = await VX30MarketData();
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

    const vx30PremiumChart = vxdata.map( (value: any) => {
      return [new Date(value['Trade Date']).getTime(), Number(value.VX30_Premium_zscore_Close)];
    });

    const vixChart = vxdata.map( (value: any) => {
      return [
        new Date(value['Trade Date']).getTime() * 1000, // [0] time
        Number(value.VIX_Open),
        Number(value.VIX_High),
        Number(value.VIX_Low),
        Number(value.VIX_Close)
      ];
    });

    const vx30Chart = vxdata.map( (value: any) => {
      return [
        new Date(value['Trade Date']).getTime() * 1000, // [0] time
        Number(value.VX30_Open),
        Number(value.VX30_High),
        Number(value.VX30_Low),
        Number(value.VX30_Close)
      ];
    });

    let [vixTsunami, rvol, vrp, vixBasis, vx30Roll, spxVixData] = await Promise.all([VixTsunami(), SPXRealizedVol(), SPXVRP(), vixbasis(),VX30RollData(), getVIXData()]);

    const spxIVols = spxVixData.map( (x:any) => {
      return [ x.symbol, x.price ]
    });


    const buyVix = vixTsunami.vix_buy.map( value => {
      return {
        x: value * 1000,
        title: 'B',
        text: 'Long VIX'
      }
    });

    const sellVix = vixTsunami.vix_sell.map( value => {
      return {
        x: value * 1000,
        title: 'S',
        text: 'Sell VIX'
      }
    });

    const buyVVix = vixTsunami.vvix_buy.map( value => {
      return {
        x: value * 1000,
        title: 'B',
        text: 'Long VVIX'
      }
    });

    const sellVVix = vixTsunami.vvix_sell.map( value => {
      return {
        x: value * 1000,
        title: 'S',
        text: 'Sell VVIX'
      }
    });


  let latest: any;
  latest = vxdata[vxdata.length -1];
  latest.ivts = vixBasis.ivts[vixBasis.ivts.length -1 ][1];
  latest.vvol = vixBasis.vvol[vixBasis.vvol.length -1 ][1];

  latest.VIX = latest.VIX_Close
  latest.VIX3M = latest.VIX3M_Close
  latest.premium = latest.VX30_Premium_Close
  latest.vx30 = latest.VX30_Close
  latest.premium_zscore = latest.VX30_Premium_zscore_Close



    res.render('index', {data: {buyVix, sellVix, buyVVix, sellVVix, vixChart, vx30Chart, vx30Roll, prices: vxPrices, vxFuturesData, latest, historical: vx30PremiumChart, rvol, vrp: vrp, vixBasis, spxIVols, livemarketdata }});
});
