import { Router } from 'express';
import NodeCache from 'node-cache';
import yahooFinance from 'yahoo-finance2'; 

export const futures = Router();

interface Product {
    description: string;
    symbol: string;
    tick_size: number;
    dollar_per_tick: number;
    notional: number;
    etf_shares: number;
    etf_symbol: string;
    price: number;
}

const calculateATR = (data: any[], period = 14): number => {
    if (data.length < period) {
        throw new Error('Data length must be greater than or equal to the ATR period.');
    }

    // Calculate the true range (TR) for each data point
    const trueRanges = [];
    for (let i = 1; i < data.length; i++) {
        const high = data[i].high;
        const low = data[i].low;
        const prevClose = data[i - 1].close;

        const trueRange = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
        trueRanges.push(trueRange);
    }

    // Calculate the average true range (ATR) using the true ranges
    let atrSum = 0;
    for (let i = 0; i < period; i++) {
        atrSum += trueRanges[i];
    }
    
    let initialATR = atrSum / period;

    for (let i = period; i < trueRanges.length; i++) {
        const currentTR = trueRanges[i];
        const prevATR = atrSum / period;
        const currentATR = (prevATR * (period - 1) + currentTR) / period;
        atrSum += currentTR - prevATR;
        initialATR = currentATR;
    }

    return initialATR;
}

futures.get('/futures', async (req, res) => {

   const futuresData: Product[] = [
       {
        description: 'SP500',
        symbol: 'ES=F',
        tick_size: 0.25,
        dollar_per_tick: 12.50,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'SPY',
        price: 0
       },
       {
        description: 'Dow',
        symbol: 'YM=F',
        tick_size: 1,
        dollar_per_tick: 5,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'DIA',
        price: 0
       },
       {
        description: 'Nasdaq',
        symbol: 'NQ=F',
        tick_size: 0.25,
        dollar_per_tick: 5,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'QQQ',
        price: 0
       },
       {
        description: 'Russell 2000',
        symbol: 'RTY=F',
        tick_size: 0.1,
        dollar_per_tick: 5,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'IWM',
        price: 0
       },
       {
        description: 'Gold',
        symbol: 'GC=F',
        tick_size: 0.1,
        dollar_per_tick: 10,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'GLD',
        price: 0
       },
       {
        description: 'Silver',
        symbol: 'SI=F',
        tick_size: 0.005,
        dollar_per_tick: 25,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'SLV',
        price: 0
       },
       {
        description: 'Crude Oil',
        symbol: 'CL=F',
        tick_size: 0.01,
        dollar_per_tick: 10,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'USO',
        price: 0
       },
       {
        description: 'Natural Gas',
        symbol: 'NG=F',
        tick_size: 0.001,
        dollar_per_tick: 10,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'UNG',
        price: 0
       },
       {
        description: 'Corn',
        symbol: 'ZC=F',
        tick_size: 0.25,
        dollar_per_tick: 12.50,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'CORN',
        price: 0
       },
       {
        description: 'Wheat',
        symbol: 'ZW=F',
        tick_size: 0.25,
        dollar_per_tick: 12.50,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'WEAT',
        price: 0
       },
       {
        description: 'Soybeans',
        symbol: 'ZS=F',
        tick_size: 0.25,
        dollar_per_tick: 12.50,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'SOYB',
        price: 0
       },
       {
        description: 'Euro',
        symbol: '6E=F',
        tick_size: 0.00005,
        dollar_per_tick: 6.25,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'FXE',
        price: 0
       },
       {
        description: 'Pound',
        symbol: '6B=F',
        tick_size: 0.0001,
        dollar_per_tick: 6.25,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'FXB',
        price: 0
       },
       {
        description: 'Canadian',
        symbol: '6C=F',
        tick_size: 0.00005,
        dollar_per_tick: 5,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'FXC',
        price: 0
       },
       {
        description: 'Australian',
        symbol: '6A=F',
        tick_size: 0.0001,
        dollar_per_tick: 10,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'FXA',
        price: 0
       },
       {
        description: 'Yen',
        symbol: '6J=F',
        tick_size: 0.0000005,
        dollar_per_tick: 6.25,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'FXY',
        price: 0
       },
       {
        description: '2 Year Treasury Notes',
        symbol: 'ZT=F',
        tick_size: 0.0035,
        dollar_per_tick: 7.8125,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'SHY',
        price: 0
       },
       {
        description: '5 Year Treasury Notes',
        symbol: 'ZF=F',
        tick_size: 0.0078,
        dollar_per_tick: 7.8125,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'IEI',
        price: 0
       },
       {
        description: '10 Year Treasury Notes',
        symbol: 'ZN=F',
        tick_size: 0.0156,
        dollar_per_tick: 15.63,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'IEF',
        price: 0
       },
       {
        description: 'Treasury Bonds',
        symbol: 'ZB=F',
        tick_size: 0.03125,
        dollar_per_tick: 31.25,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'TLT',
        price: 0
       },
       {
        description: 'Ultra Bonds',
        symbol: 'UB=F',
        tick_size: 0.03125,
        dollar_per_tick: 31.25,
        notional: 0,
        etf_shares: 0,
        etf_symbol: 'TLT',
        price: 0
       },
   ]

   const nodeCache = (req.app.locals.nodeCache as NodeCache);

   let data: Product[] = nodeCache.get('futures');
   if (data == undefined) {
    data = await Promise.all(futuresData.map( async future => {
        const data = (await yahooFinance.quote(future.symbol))
        future.price = data.bid;
        future.notional = data.bid * (future.dollar_per_tick / future.tick_size)
        const etf = (await yahooFinance.quote(future.etf_symbol))
        future.etf_shares = Math.floor(future.notional / etf.bid);
        return future;
       }));
       nodeCache.set('futures', data, 604800);
   }

   const fromDate = new Date()
   fromDate.setDate(fromDate.getDate() - 90);

   // need to calulate the daily ATR of each futures contract
   data = await Promise.all(data.map( async future => {
    const queryOptions = { period1: fromDate.toDateString()}
    const prices = (await yahooFinance._chart(future.symbol, queryOptions))
    //const atr = calculateATR(prices.quotes);
    return future;
   }));


    res.render('futures', {data });
})
