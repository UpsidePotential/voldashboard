import { buildVXData, getVXFuturesData, getNumberOfDays, convertContractName, buildVXSpreads, vixOptionsChain, spxOptionsChain } from "../vix";
import { VXEntry, VXEntryModel } from "../vxModel";
import { VXContractEntryModel } from '../vxContracts' 
import { VXSpreadEntryModel } from "../vxSpread";
import { MarketData } from "./marketData";
import { VIXOptionChainEntryModel, VIXOptionEntry } from "../vixoptionsModel";
import { SPXOptionChainEntryModel, SPXOptionEntry } from "../spxoptionsModel";

export const updateVXData = async (marketData: MarketData): Promise<VXEntry> => {
    const vx_sum = await VXEntryModel.find().exec()
    const newData = await buildVXData(marketData, vx_sum);

    const doc = new VXEntryModel({
        date: newData.date,
        premium: newData.premium,
        premium_mean: newData.premium_mean,
        premium_sd: newData.premium_sd,
        premium_zscore: newData.premium_zscore,
        VIX: newData.VIX,
        VIX3M: newData.VIX3M,
        vx1: newData.vx1,
        vx1_DTE: newData.vx1_DTE,
        vx1_weight_30: newData.vx1_weight_30,
        vx2: newData.vx2,
        vx2_DTE: newData.vx2_DTE,
        vx2_weight_30: newData.vx2_weight_30,
        vx30: newData.vx30,
        vx30_tr: newData.vx30_tr,
    });

    try {
        await doc.save();
    } catch(e) {
        console.error(`failed to update vx data: ${e}`)
    }

    return newData;
}

interface VIXOption {
    ask: number;
    bid: number;
    delta: number;
    low: number;
    high: number;
    open: number;
    open_interest: number;
    option: string;
    iv: number;
}

interface VIXOptionsChain {
    date: number;
    options: VIXOption[]
}
//const optionscode = `VIX${year}${month}${vx1Exp.getDate()}P`;
interface VIXOptionCode {
    exp: number;
    strike: number;
    type: string;
}

const parseOptionsCode = (option: string): VIXOptionCode => {
    // const underlyingSymbol = option.substring(0, 3);
    const expirationDate = option.substring(3, 9);
    const optionType = option.charAt(9);
    const strikePrice = option.substring(10, 15);

    const date = new Date(expirationDate.replace(/(\d{2})(\d{2})(\d{2})/, '20$1-$2-$3')).valueOf();

    //const strikeString = option.substring(optionscode.length)
    // Strike Price (#####.###) listed with five digits before the decimal and three digits following the decimal
    const strike = parseFloat(strikePrice.substring(0,5) + '.' + strikePrice.substring(5))

    return {exp: date, strike, type: optionType};
}

export const updateVIXOptionsData = async (): Promise<void> => {

    const vixOptionsData: VIXOptionsChain = (await vixOptionsChain()).data;
    const date = new Date().valueOf();
    const vixoptionschain = vixOptionsData.options.filter(value => value.option.charAt(3) !== 'W').map( option => {
        const code = parseOptionsCode(option.option);
            return { date, strike: code.strike + code.type, expiration: code.exp, oi: option.open_interest, delta: option.delta, ask: option.ask, bid: option.bid}
    });

    // need to remap the data to recreate the chain.  need to group by expiration
    const groupedData = vixoptionschain.reduce((result: any, currentItem) => {
        const date = currentItem.expiration;
      
        // Check if the date group already exists, create it if not
        if (!result[date]) {
          result[date] = [];
        }

        const option: VIXOptionEntry = {ask: currentItem.ask, bid: currentItem.bid, delta: currentItem.delta, strike: currentItem.strike, oi: currentItem.oi };
      
        // Add the current item to the date group
        result[date].push(option);
      
        return result;
      }, {});

      // Convert the grouped data to an array of objects
        const resultArray = Object.keys(groupedData).map(date => ({
            date,
            options: groupedData[date],
        }));
  

    const doc = new VIXOptionChainEntryModel({date, expirations: resultArray});
    try {
        await doc.save();
    } catch(e) {
        console.error(`failed to update vix options: ${e}`)
    }

}

export const updateSPXOptionsData = async (): Promise<void> => {

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

        const option: SPXOptionEntry = {iv: currentItem.iv, ask: currentItem.ask, bid: currentItem.bid, delta: currentItem.delta, strike: currentItem.strike, oi: currentItem.oi };
      
        // Add the current item to the date group
        result[date].push(option);
      
        return result;
      }, {});

      // Convert the grouped data to an array of objects
        const resultArray = Object.keys(groupedData).map(date => ({
            date,
            options: groupedData[date],
        }));
  

    const doc = new SPXOptionChainEntryModel({date, expirations: resultArray});
    try {
        await doc.save();
    } catch(e) {
        console.error(`failed to update SPX options: ${e}`)
    }

}

export const updateVXCalenderData = async (): Promise<void> => {

    const vxContracts = (await getVXFuturesData()).filter((x: any) => x.last_price > 0);

    for( const [i, contract] of vxContracts.entries()) {
        const doc = new VXContractEntryModel({
            date: new Date(),
            name: convertContractName(contract.symbol),
            open: contract.open,
            close: contract.last_price,
            expiry: new Date(contract.expiration),
            volume: contract.volume,
            openinterest: contract.prev_open_int,
            c2c_logreturn: Math.log(contract.last_price / contract.prev_close),
            dte: getNumberOfDays(new Date(), new Date(contract.expiration)),
            contract: i+1,
        });

        try {
            await doc.save();
        } catch(e) {
            console.error(`failed to update vx contract: ${e}`)
        }
    }

    const spreads = buildVXSpreads(vxContracts);
    for( const [i, spread] of spreads.entries()) {
        try {
            const doc = new VXSpreadEntryModel(spread);
            await doc.save();
        } catch(e) {
            console.error(`failed to update vx spread: ${e}`)
        }
    }
}