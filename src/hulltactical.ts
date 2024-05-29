import { Router } from 'express';
import got from 'got'
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

export const marketPositioning = async(): Promise<any> => {
 const csv = await got('https://www.hulltacticalfunds.com/weights.csv');
 const sentiment = await parseCSV(csv.body);

 return sentiment[0];  
};
