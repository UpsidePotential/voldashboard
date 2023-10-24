import { buildVXData, getVXFuturesData, getNumberOfDays, convertContractName, buildVXSpreads } from "../vix";
import { VXEntry, VXEntryModel } from "../vxModel";
import { VXContractEntryModel } from '../vxContracts' 
import { VXSpreadEntryModel } from "../vxSpread";

export const updateVXData = async (): Promise<VXEntry> => {
    const vx_sum = await VXEntryModel.find().exec()
    const newData = await buildVXData(vx_sum);

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