import got from 'got';
import yahooFinance from 'yahoo-finance2'; 

import { VXEntry } from "./vxModel";
import { VXSpreadEntry } from './vxSpread';

export interface FuturesContract {
    active: boolean;
    "active-month": boolean;
    "back-month-first-calendar-symbol": boolean;
    "expiration-date": string;
    "is-closing-only": boolean;
    "next-active-month": boolean;
    symbol: string;
    'product-code': string;
    'streamer-symbol': string;
}

export const cboeVixEndpoint = (date: Date): string => {
  const year = date.getFullYear();
  
  // JavaScript months are 0-indexed, so we add 1 to get the correct month
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const day = date.getDate().toString().padStart(2, '0');
  return `https://cdn.cboe.com/api/global/delayed_quotes/term_structure/${year}/VIX_${year}-${month}-${day}.json`
}

export const vixOptionsChain = async (): Promise<any> => {
  return got('https://cdn.cboe.com/api/global/delayed_quotes/options/_VIX.json').json() as any;
}


const fetchVixData = async () : Promise<any> => {
  let retry = 0
  const date = new Date();
  
  while(retry < 5) {
    try {
      return await got(cboeVixEndpoint(date)).json() as any;
    } catch (ex) {
      retry++;
      date.setDate(date.getDate() - 1);
    }
  }

  throw new Error('Failed to fetch VIX Futures Data. Tried too many times')
}

export const getVIXData = async () : Promise<any> => {

 const result = await fetchVixData();
  const prices = result.data.prices.reverse();

  if(prices.length == 0) {
    return [];
  }

  return result.data.expirations.map((element: any) => {
    const price = prices.find( (n: any) => n.index_symbol == element.symbol);
    const expDate = new Date(element.expirationDate);
    expDate.setDate(expDate.getDate());
    return { symbol: element.symbol, mounth: element.month, expDate: Date.parse(element.expirationDate), price: price.price};
  });  
}

export const getVXFuturesData = async () : Promise<any[]> => {
  const vxData = await got('https://www.cboe.com/us/futures/api/get_quotes_combined/?symbol=VX&rootsymbol=null').json() as any;
  return vxData.data.filter((x: any)=> x.symbol.length == 5)
}

export const convertContractName = (name: string): string => {
  // cboe name 'VX/Z3'
  // rw name 'VX-2024M'

  const monthCode = name.charAt(3);
  const yearCode = name.charAt(4);
  const yearBase = new Date().getFullYear().toString().slice(0,-1);
  
  return `VX-${yearBase}${yearCode}${monthCode}`;
}

interface DteWeights {
    vx1DTE: number;
    vx2DTE: number;
    vx1_30Weight: number;
    vx2_30Weight: number;
}

export const contractWeightTW = (vx1: FuturesContract, vx2: FuturesContract) : DteWeights => {
    const vx1DTE = vxContractDTE(vx1);
    const vx2DTE = vxContractDTE(vx2);
    let vx1_30Weight = 0;
    let vx2_30Weight = 0;

    if(vx1DTE >= 30) {
        vx1_30Weight = 1.0;
    }
    else {
        const vx1Dist = Math.abs(vx1DTE - 30)
        const vx2Dist = Math.abs(vx2DTE - 30)
        const sum = (vx1Dist + vx2Dist);

        vx1_30Weight = (sum - vx1Dist) / sum;
        vx2_30Weight = (sum - vx2Dist) / sum;

    }

    return { vx1DTE, vx2DTE, vx1_30Weight, vx2_30Weight };
}

export const contractWeight = (vx1: Date, vx2: Date) : DteWeights => {
  const date = new Date();
  const vx1DTE = getNumberOfDays(date, vx1);
  const vx2DTE = getNumberOfDays(date, vx2);
  let vx1_30Weight = 0;
  let vx2_30Weight = 0;

  if(vx1DTE >= 30) {
      vx1_30Weight = 1.0;
  }
  else {
      const vx1Dist = Math.abs(vx1DTE - 30)
      const vx2Dist = Math.abs(vx2DTE - 30)
      const sum = (vx1Dist + vx2Dist);

      vx1_30Weight = (sum - vx1Dist) / sum;
      vx2_30Weight = (sum - vx2Dist) / sum;

  }

  return { vx1DTE, vx2DTE, vx1_30Weight, vx2_30Weight };
}

export const getNumberOfDays = (start: Date, end: Date) => {
    const date1 = new Date(start);
    const date2 = new Date(end);

    // One day in milliseconds
    const oneDay = 1000 * 60 * 60 * 24;

    // Calculating the time difference between two dates
    const diffInTime = date2.getTime() - date1.getTime();

    // Calculating the no. of days between two dates
    const diffInDays = Math.round(diffInTime / oneDay);

    return diffInDays;
}

export const vxContractDTE = (contract: FuturesContract): number => {
    const date = new Date();
    const expDate = new Date(contract['expiration-date']);

    return getNumberOfDays(date, expDate);
}

export const humanVXName = (vxContract: String) : String => {
    return vxContract.slice(1, 6)
}

export const simpleMovingAverage = (prices: number[], interval: number): number[] => {
    let index = interval - 1;
    const length = prices.length + 1;
    let results = [];
  
    while (index < length) {
      index = index + 1;
      const intervalSlice = prices.slice(index - interval, index);
      const sum = intervalSlice.reduce((prev, curr) => prev + curr, 0);
      results.push(sum / interval);
    }
  
    return results;
}

export const simpleMovingStdDev = (arr: number[][], windowSize: number): number[][] => {
    const result: any = [];
    let sum = 0;
    let sumOfSquares = 0;
  
    // Calculate the sum and sum of squares for the initial window
    for (let i = 0; i < windowSize; i++) {
      sum += arr[i][1];
      sumOfSquares += arr[i][1] * arr[i][1];
    }
  
    //result.push([0, Math.sqrt((sumOfSquares - (sum * sum) / windowSize) / windowSize)]);
  
    // Calculate the rolling standard deviation for the remaining elements
    for (let i = windowSize; i < arr.length; i++) {
      sum += arr[i][1] - arr[i - windowSize][1];
      sumOfSquares += arr[i][1] * arr[i][1] - arr[i - windowSize][1] * arr[i - windowSize][1];
      result.push([arr[i][0], Math.sqrt((sumOfSquares - (sum * sum) / windowSize) / windowSize)]);
    }
  
    return result;
}

export const rollingZScore = (arr: number[][], windowSize: number): number[][] => {
    if (arr.length <= windowSize) {
      throw new Error("Array length should be greater than the window size.");
    }
  
    const result: any = [];
    let sum = 0;
    let sumOfSquares = 0;
  
    // Calculate the sum and sum of squares for the initial window
    for (let i = 0; i < windowSize; i++) {
      sum += arr[i][1];
      sumOfSquares += arr[i][1] * arr[i][1];
    }
  
    const mean = sum / windowSize;
    const stdDev = Math.sqrt((sumOfSquares - (sum * sum) / windowSize) / windowSize);
  
    //result.push([0, (arr[0][1] - mean) / stdDev]);
  
    // Calculate the rolling Z-score for the remaining elements
    for (let i = windowSize; i < arr.length; i++) {
      sum += arr[i][1] - arr[i - windowSize][1];
      sumOfSquares += arr[i][1] * arr[i][1] - arr[i - windowSize][1] * arr[i - windowSize][1];
  
      const newMean = sum / windowSize;
      const newStdDev = Math.sqrt((sumOfSquares - (sum * sum) / windowSize) / windowSize);
  
      result.push([arr[i][0], (arr[i][1] - newMean) / newStdDev]);
    }
  
    return result;
  }

  export const recalculateStandardDeviation = (existingStandardDeviation: number, datasetSize: number, existingMean: number, newDataValue: number) =>{
    const newDatasetSize = datasetSize + 1;
    const delta = newDataValue - existingMean;
    const newMean = existingMean + delta / newDatasetSize;
    const newVariance = ((datasetSize * existingStandardDeviation * existingStandardDeviation) +
      (delta * (newDataValue - newMean))) / newDatasetSize;
    const newStandardDeviation = Math.sqrt(newVariance);
    return newStandardDeviation;
  }
  
  export const buildVXData = async (historicalvxData: VXEntry[]) : Promise<VXEntry> => {
    const fromDate = new Date()
    const toDate = new Date()
    fromDate.setDate(fromDate.getDate() - 5);

    const vxFutsData = await getVXFuturesData(); 

    const vix = (await yahooFinance.quote('^VIX')).regularMarketPrice;
    const vix3m = (await yahooFinance.quote('^VIX3M')).regularMarketPrice;

    const vx1 = vxFutsData[0].last_price;
    const vx2 = vxFutsData[1].last_price;

    const lastVXData = historicalvxData[historicalvxData.length-1];

    const weights = contractWeight(vxFutsData[0].expiration, vxFutsData[1].expiration);
    const vx30 = (vx1 * weights.vx1_30Weight) + (vx2 * weights.vx2_30Weight);
    const premium = Math.log(vx30/vix3m)
    const premium_mean =  ((lastVXData.premium_mean * 252) + premium) / 253;
    const premium_sd = recalculateStandardDeviation(lastVXData.premium_sd, 252, lastVXData.premium_mean, premium);
    const premium_zscore = (premium - premium_mean)/premium_sd;

    // take last vxData in the historical data set.

    const vxData: VXEntry = {
        date: toDate.valueOf(),
        premium,
        premium_mean,
        premium_sd,
        premium_zscore,
        VIX: vix,
        VIX3M: vix3m,
        vx1: vx1,
        vx1_DTE: weights.vx1DTE,
        vx1_weight_30: weights.vx1_30Weight,
        vx2: vx2,
        vx2_DTE: weights.vx2DTE,
        vx2_weight_30: weights.vx2_30Weight,
        vx30,
        vx30_tr: 0,
    }

    return vxData;
}

const buildVxPair = (a: any, b: any, name: string): VXSpreadEntry => {
  if(a.last_price && b.last_price) {
    return {
      date: new Date().valueOf(),
      name: "",
      level: 0,
      front: 0,
      back : 0,
      dte: getNumberOfDays(new Date(), new Date(a.expiration)),
      pointslope: 0,
      logslope: 0,
      logreturns: Math.log(b.last_price / b.prev_close) - Math.log(a.last_price / a.prev_close),
    }
  }
  const level = (a.last_price + b.last_price) * 0.5
  const front = a.last_price;
  const back = b.last_price;

  const pointslope = a.last_price - b.last_price;
  const logslope = Math.log(a.last_price / b.last_price)

  return {
    date: new Date().valueOf(),
    name,
    level,
    front,
    back,
    dte: getNumberOfDays(new Date(), new Date(a.expiration)),
    pointslope,
    logslope,
    logreturns: Math.log(b.last_price / b.prev_close) - Math.log(a.last_price / a.prev_close),
  }
  
}

export const buildVXSpreads = (vxfutures: any[]) : VXSpreadEntry[] => {
  const calenders: VXSpreadEntry[] = [];

  calenders.push(buildVxPair(vxfutures[0], vxfutures[1], "vx12"));
  calenders.push(buildVxPair(vxfutures[1], vxfutures[2], "vx23"));
  calenders.push(buildVxPair(vxfutures[2], vxfutures[3], "vx34"));
  calenders.push(buildVxPair(vxfutures[3], vxfutures[4], "vx45"));
  //calenders.push(buildVxPair(vxfutures[4], vxfutures[5], "vx56"));
  return calenders;
}

export const calculateContango = (currentPrice: number, nextPrice: number): number => {
  const contango = ((nextPrice - currentPrice) / currentPrice)
  return contango;
}

export const rollYield = (currentPrice: number, nextPrice: number, daysToExpiry: number): number => {
  return (nextPrice - currentPrice) / (currentPrice * daysToExpiry)
}

interface RVol {
  d9: any[];
  d30: any[];
  d90: any[];
}
export const SPXRealizedVol = async (): Promise<RVol> => {
  const rvolData = await got(`${process.env.DASHBOARD_URL}/realized_vol_term/json/^spx`);
  return JSON.parse(rvolData.body);
}


interface VRP {
  d30: any[];
  d30Zscore: any[]
}
export const SPXVRP = async (): Promise<VRP> => {
  const rvolData = await got(`${process.env.DASHBOARD_URL}/vrp/json`);
  return JSON.parse(rvolData.body);
}

export const vixbasis = async (): Promise<any> => {
  const rvolData = await got(`${process.env.DASHBOARD_URL}/vixBasis`);
  return JSON.parse(rvolData.body);
}
