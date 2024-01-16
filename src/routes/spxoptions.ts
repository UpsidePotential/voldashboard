import { Router } from 'express';

import { parseOptionsCode, spxOptionsChain, VIXOptionsChain} from '../vix';


export const spxOptions = Router();

spxOptions.get('/spxoptions', async (req, res) => {
    const spxOptionsData: VIXOptionsChain = (await spxOptionsChain()).data;
    const date = new Date().valueOf();
    const spxoptionschain = spxOptionsData.options.filter(value => value.option.charAt(3) !== 'W').map( option => {
        const code = parseOptionsCode(option.option);
        return { date, iv: option.iv, strike: code.strike + code.type, expiration: code.exp, oi: option.open_interest, delta: option.delta, ask: option.ask, bid: option.bid}
    });

    const filteredExpirations = spxoptionschain.filter(value => {
        const strikePrice = parseInt(value.strike.slice(0, -1)); // Removing the 'p' and converting to integer
        return strikePrice % 100 === 0;
    });

    // need to remap the data to recreate the chain.  need to group by expiration
    const groupedData = filteredExpirations.reduce((result: any, currentItem) => {
        const date = currentItem.expiration;
      
        // Check if the date group already exists, create it if not
        if (!result[date]) {
          result[date] = [];
        }

        const option = {iv: currentItem.iv, ask: currentItem.ask, bid: currentItem.bid, delta: currentItem.delta, strike: currentItem.strike, oi: currentItem.oi };
      
        // Add the current item to the date group
        result[date].push(option);
      
        return result;
      }, {});

      // Convert the grouped data to an array of objects
        const resultArray = Object.keys(groupedData).map(date => ({
            date,
            options: groupedData[date],
        }));

    return res.json({ date, expirations: resultArray})
})
