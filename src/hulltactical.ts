import { Router } from 'express';
import got from 'got'
import cheerio from 'cheerio';
import { parseString  } from '@fast-csv/parse'


export const hull = Router();

function parseCSV(data: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    parseString(data, { headers: true })
      .on('error', error => reject(error))
      .on('data', row => results.push(row))
      .on('end', () => resolve(results));
  });
}

export const sentimentMeter = async(): Promise<number> => {
    const data = await got('https://www.hulltacticalfunds.com/market-sentiment-meter');

    const $ = cheerio.load(data.body);
    const spanText  = $('#meter_data').text();
    const numberMatch = spanText.match(/\d+/);
    const numberValue = numberMatch ? numberMatch[0] : null;
    return Number(numberValue);
};

export const marketPositioning = async(): Promise<any> => {
 const csv = await got('https://www.hulltacticalfunds.com/weights.csv');
 const sentiment = await parseCSV(csv.body);

 return sentiment[0];  
};
