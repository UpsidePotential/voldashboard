import { Router } from 'express';
import { VXSpreadEntryModel } from '../vxSpread'
import { buildVXSpreads, getVXFuturesData, rollingZScore, simpleMovingStdDev } from '../vix'

export const vxCalendar = Router();


const vxSpread = (spread: any, currentSpread: any): any => {

    // append current spread on to this spread.
    spread.push(currentSpread);
    const logReturns = spread.map( (value: any) => [value.date, value.logreturns]);
    const stdDev = simpleMovingStdDev(logReturns, 252);

    const logslope = spread.map( (value: any) => [value.date, value.logslope]);
    const zscore = rollingZScore(logslope, 252);

    return {
        logReturns,
        stdDev,
        logslope,
        zscore,
        back: currentSpread.back,
        front: currentSpread.front,
        name: currentSpread.name,
        dte: currentSpread.dte,
    }
}

const SpreadNames = ["vx12", "vx23", "vx34", "vx45"];


vxCalendar.get('/vxcalendar', async (req, res) => {

    const vxContracts = (await getVXFuturesData()).filter((x: any) => x.last_price > 0);
    const currentSpreads = buildVXSpreads(vxContracts);

    const spreads = await VXSpreadEntryModel
        .find()
        .sort( { date: -1 })
        .limit( 5 * 500 ).exec();

    const data = SpreadNames.map( name => {
        const spread = spreads.filter( spread => spread.name === name).reverse();
        return vxSpread(spread, currentSpreads.find(x => x.name == name));
    });


    res.render('vxcalendar', {data });
})
