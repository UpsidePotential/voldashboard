import { parse } from '@fast-csv/parse'
import { format } from '@fast-csv/format'
import fs from 'fs'
import { connect } from 'mongoose';
import { VXEntryModel } from '../../src/vxModel';
import { cboeVixEndpoint } from '../../src/vix';
import got from 'got';
import { VXContractEntryModel } from '../../src/vxContracts';
import { VXSpreadEntryModel } from '../../src/vxSpread';

require('dotenv').config();

interface VXData {
    index: string;
    date: string;
    premium: string;
    premium_mean: string;
    premium_sd: string;
    premium_zscore: string;
    VIX: string;
    VIX3M: string;
    vx1: string;
    vx1_DTE: string;
    vx1_weight_30: string;
    vx2: string;
    vx2_DTE: string;
    vx2_weight_30: string;
    vx30: string;
    vx30_tr: string;
}

export const parseCSV = async (path: String): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const results: any[] = [];

        fs.createReadStream(path as any)
            .pipe(parse({ headers: true }))
            .on('error', error => console.error(error))
            .on('data', row => results.push(row))
            .on('end', (rowCount: number) => {
                resolve(results);
            });
    });
}

const writetoCSV = (filename: string, data: any[]) => {
    const stream = format({headers: true});
    const writeSteam = fs.createWriteStream(filename);
    stream.pipe(writeSteam);

    data.forEach(obj => {
        stream.write(obj);
    });

    stream.end()

}

const appendToCSVFile = (filePath: string, dataToAppend: any[]) => {
    // Check if the file exists
    let headers = false;
    if (!fs.existsSync(filePath)) {
        headers = true;
    }
  
    // Create a writable stream to append data to the file
    const writableStream = fs.createWriteStream(filePath, { flags: 'a' });
  
    // Create a CSV formatter
    const csvFormatter = format({ headers });
  
    // Pipe the CSV formatter to the writable stream
    csvFormatter.pipe(writableStream);
  
    // Write the new data to the CSV file
    dataToAppend.forEach((row) => {
      csvFormatter.write(row);
    });

    writableStream.write('\n');
  
    // End the CSV formatting and close the writable stream
    csvFormatter.end();
  }

const parseNumber = (value: string): number => {
    const num = Number(value);
    if(isNaN(num))
    {
        return -1;
    }
    return num;
}


async function uploadVxData() {
    const databaseAcess = `mongodb+srv://${process.env.DB_USER
        }:${process.env.DB_PASS
        }@${process.env.DB_CLUSER
        }.mongodb.net/${process.env.DB_NAME
        }?retryWrites=true&w=majority`;

    await connect(databaseAcess, {});
    
    await VXEntryModel.deleteMany({});

    const vxdata: VXData[] = await parseCSV('./data/vx_data.csv');
    for(let i = 0; i < vxdata.length; i++)
    {
        const value = vxdata[i];
        const doc = new VXEntryModel({
            date: new Date(value.date),
            premium: parseNumber(value.premium),
            premium_mean: parseNumber(value.premium_mean),
            premium_sd: parseNumber(value.premium_sd),
            premium_zscore: parseNumber(value.premium_zscore),
            VIX: parseNumber(value.VIX),
            VIX3M: parseNumber(value.VIX3M),
            vx1: parseNumber(value.vx1),
            vx1_DTE: parseNumber(value.vx1_DTE),
            vx1_weight_30: parseNumber(value.vx1_weight_30),
            vx2: parseNumber(value.vx2),
            vx2_DTE: parseNumber(value.vx2_DTE),
            vx2_weight_30: parseNumber(value.vx2_weight_30),
            vx30: parseNumber(value.vx30),
            vx30_tr: parseNumber(value.vx30_tr)
        });

        try {
            await doc.save();
        } catch (e) {
            console.error('failed to save vx entry', e)
        }
    }
}

const fetchVixData = async (date: Date) : Promise<any> => {
    let retry = 0
    
    while(retry < 5) {
      try {
          const endpoint = cboeVixEndpoint(date);
          console.log(`endpoint: ${endpoint}`);
          const data = await got(endpoint).json() as any;
          data['reqDate'] = date;
          return data;
      } catch (ex) {
        retry++;
        date.setDate(date.getDate() - 1);
      }
    }
  
    throw new Error('Failed to fetch VIX Futures Data. Tried too many times')
  }

async function downloadSPXTermStructure() {
    let date = new Date();
    while(true) {
        const data = await fetchVixData(date);
        const prices = data.data.prices.reverse();

        

        if(prices.length == 0) {
            console.error('empty prices')
          continue;
        }

        console.log(data.reqDate);
      
        const spxData = data.data.expirations.map((element: any) => {
          const price = prices.find( (n: any) => n.index_symbol == element.symbol);
          const expDate = new Date(element.expirationDate);
          expDate.setDate(expDate.getDate());
          return { time: data.reqDate.valueOf(), symbol: element.symbol, mounth: element.month, expDate: Date.parse(element.expirationDate), price: price.price};
        });  

        // write to a csv file
        appendToCSVFile('spxVixData.csv', spxData)

        date = new Date(data.reqDate);
        date.setDate(date.getDate() - 1);
    }

}

async function generateSPXVsVXData() {
    const vxdata: VXData[] = await parseCSV('./data/vx_contracts.csv');
    const spxdata: VXData[] = await parseCSV('./data/spxVixData.csv');

}

async function updateVxContracts() {
    const databaseAcess = `mongodb+srv://${process.env.DB_USER
        }:${process.env.DB_PASS
        }@${process.env.DB_CLUSER
        }.mongodb.net/${process.env.DB_NAME
        }?retryWrites=true&w=majority`;

    await connect(databaseAcess, {});
    
    await VXContractEntryModel.deleteMany({});

    const vxdata = await parseCSV('./data/vx_contracts.csv');
    for(let i = 0; i < vxdata.length; i++)
    {
        const value = vxdata[i];
        const doc = new VXContractEntryModel({
            date: new Date(value.date),
            name: value.ticker,
            open: parseNumber(value.open),
            close: parseNumber(value.close),
            expiry: new Date(value.expiry),
            volume: parseNumber(value.volume),
            openinterest: parseNumber(value['open_interest']),
            c2c_logreturn: parseNumber(value['c2c_logreturn']),
            dte: parseNumber(value.DTE),
            contract: parseNumber(value.contract),
        });

        try {
            await doc.save();
        } catch (e) {
            console.error('failed to save vx contract', e)
        }
    }
}

async function updateVxSpreads() {
    const databaseAcess = `mongodb+srv://${process.env.DB_USER
        }:${process.env.DB_PASS
        }@${process.env.DB_CLUSER
        }.mongodb.net/${process.env.DB_NAME
        }?retryWrites=true&w=majority`;

    await connect(databaseAcess, {});
    
    await VXSpreadEntryModel.deleteMany({});

    const vxdata = await parseCSV('./data/spreads.csv');
    for(let i = 0; i < vxdata.length; i++)
    {
        const value = vxdata[i];
        const doc = new VXSpreadEntryModel({
            date: new Date(value.date),
            name: value.spread,
            level: parseNumber(value.level),
            front: parseNumber(value.front),
            back: parseNumber(value.back),
            dte: parseNumber(value.DTE),
            pointslope: parseNumber(value.pointslope),
            logslope: parseNumber(value.logslope),
            logreturns: parseNumber(value.logreturns),
        });

        try {
            await doc.save();
        } catch (e) {
            console.error('failed to save vx contract', e)
        }
    }
}


updateVxSpreads().then( () => {
    console.log('finished vx contracts')
})
