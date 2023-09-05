import { buildVXData, FuturesContract } from "../vix";
import { VXEntry, VXEntryModel } from "../vxModel";

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