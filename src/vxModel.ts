import { Schema, model } from 'mongoose';

// 1. Create an interface representing a document in MongoDB.
interface VXEntry {
    date: number;
    premium: number;
    premium_mean: number;
    premium_sd: number;
    premium_zscore: number;
    VIX: number;
    VIX3M: number;
    vx1: number;
    vx1_DTE: number;
    vx1_weight_30: number;
    vx2: number;
    vx2_DTE: number;
    vx2_weight_30: number;
    vx30: number;
    vx30_tr: number;
}

// 2. Create a Schema corresponding to the document interface.
const schema = new Schema<VXEntry>({
  date: { type: Number, required: true },
  premium: { type: Number, required: true },
  premium_mean: { type: Number, required: true },
  premium_sd: { type: Number, required: true },
  premium_zscore: { type: Number, required: true },
  VIX: { type: Number, required: true },
  VIX3M: { type: Number, required: true },
  vx1: { type: Number, required: true },
  vx1_DTE: { type: Number, required: true },
  vx1_weight_30: { type: Number, required: true },
  vx2: { type: Number, required: true },
  vx2_DTE: { type: Number, required: true },
  vx2_weight_30: { type: Number, required: true },
  vx30: { type: Number, required: true },
  vx30_tr: { type: Number, required: true },
});

schema.index( {date: 1}, { unique: true});

// 3. Create a Model.
const VXEntryModel = model<VXEntry>('VXEntry', schema);
export { VXEntryModel, VXEntry };
