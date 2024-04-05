
import { Router } from 'express';

//import { calculateLongShortFundingRate } from '@drift-labs/sdk/src/math/funding'

export const drift = Router();


const MarketIndex: { [key: string]: number } = {
    "SOL-PERP": 0,
    "BTC-PERP": 1,
    "ETH-PERP": 2,
    "JTO-PERP": 20,
    "RLB-PERP": 17,
    "BNB-PERP": 8,
};

async function fetchData(index: number) {
    const currentTime = Date.now();
    const currentFormattedTimeStamp = Math.floor(currentTime / 1000) + (currentTime % 1000 / 1000);
    // Get timestamp for 30 days ago
    const thirtyDaysAgoTimeStamp = currentTime - (30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
    // Convert to seconds and format
    const thirtyDaysAgoFormattedTimeStamp = Math.floor(thirtyDaysAgoTimeStamp / 1000) + (thirtyDaysAgoTimeStamp % 1000 / 1000);

   const data = await fetch(`https://mainnet-beta.api.drift.trade/fundingRates?marketIndex=${index}&from=${thirtyDaysAgoFormattedTimeStamp}&to=${currentFormattedTimeStamp}`, {
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Origin": "https://app.drift.trade",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site"
        },
    });


   return data.json();
  }

  function calculateRollingAverage(data: any) {
    const result = [];
  
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      
      // Calculate sum of values for the last 5 days
      for (let j = i; j >= Math.max(0, i - 4 * 24); j--) { // Adjusted for hourly samples
        sum += Number(data[j][1]);
        count++;
      }
  
      // Calculate average
      const average = sum / count;
      
      // Add average to result
      result.push({ time: data[i][0], average: average });
    }
  
    return result;
  }

drift.get('/drift', async (req, res) => {

    let fundingHistory = [];

    for(const key in MarketIndex) {
        if(MarketIndex.hasOwnProperty(key)) {
            const value = MarketIndex[key];
            const data = await fetchData(value) as any;
            const history = data.fundingRates.map( (e: any) => {

                const apy = ((e.fundingRate / e.oraclePriceTwap) * (365.25 * 24) / 10).toFixed(6);
                return [Number(e.ts*1000), Number(apy)]
           })
            fundingHistory.push({perp: key, history})
        }
    }


    fundingHistory = fundingHistory.map( value => {
        return {perp: value.perp, average: calculateRollingAverage(value.history), history: value.history}
    });

    res.render('drift', {data: {fundingHistory} });
})