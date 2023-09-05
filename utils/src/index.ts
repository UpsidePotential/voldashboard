import { parse } from '@fast-csv/parse'
import { format } from '@fast-csv/format'
import fs from 'fs'
import { connect } from 'mongoose';
import { VXEntryModel } from '../../src/vxModel';

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

const parseNumber = (value: string): number => {
    const num = Number(value);
    if(isNaN(num))
    {
        return -1;
    }
    return num;
}


async function main() {
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

main().then(() => {
    console.log('done');
})