import { Router } from 'express';
import { buildVXData, FuturesContract, getNumberOfDays, getVXFuturesData, vixOptionsChain, vxContractDTE} from '../vix';

import yahooFinance from 'yahoo-finance2'; 

export const vixperation = Router();

function isDateWithin5Days(date1: Date, date2: Date) {
    // Parse the input dates into JavaScript Date objects
    const d1 = new Date(date1);
    const d2 = new Date(date2);
  
    // Calculate the time difference in milliseconds
    const timeDifference = Math.abs(d1.valueOf() - d2.valueOf());
  
    // Calculate the difference in days
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
  
    // Check if the difference is less than or equal to 5 days
    return daysDifference <= 5;
  }

vixperation.get('/vixperation', async (req, res) => {

  const vixOptionsData = await vixOptionsChain();
  const vxFutures = await getVXFuturesData();
  const vx1 = vxFutures[0];
  const vx1Exp = new Date(vx1.expiration);

  const year = String(vx1Exp.getFullYear()).substring(2,4);
  const month = String(vx1Exp.getMonth()+1).padStart(2,'0');

  const optionscode = `VIX${year}${month}${vx1Exp.getDate()}P`;

    
    //remove weekly vix options
    const vixOptions = vixOptionsData.data.options.filter( (value: any) => value.option.startsWith(optionscode));

    const vix = vixOptionsData.data.current_price;
    

    const prices = vixOptions.map((option: any) => {
      const strikeString = option.option.substring(optionscode.length)
      // Strike Price (#####.###) listed with five digits before the decimal and three digits following the decimal
      const strike = parseFloat(strikeString.substring(0,5) + '.' + strikeString.substring(5))
      const price = option.ask
      const breakeven = strike - price;
      return { strike, price, breakeven, vixBreakEven: breakeven - vix };
    });

  res.render('vixperation', {data: {vix, vx: vx1.last_price, dte: getNumberOfDays(new Date(), new Date(vx1.expiration)), prices } } );
})
