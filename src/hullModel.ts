import { Schema, model } from 'mongoose';

// 1. Create an interface representing a document in MongoDB.
interface HullEntry {
    date: number;
    meter: number;
    cash: number;
    sp500: number;
    uvxy: number;
    erp_6m: number;
    nav: number;
}

// 2. Create a Schema corresponding to the document interface.
const schema = new Schema<HullEntry>({
  date: { type: Number, required: true },
  meter: { type: Number, required: true },
  cash: { type: Number, required: true },
  sp500: { type: Number, required: true },
  uvxy: { type: Number, required: true },
  erp_6m: { type: Number, required: true },
  nav: { type: Number, required: true },
});

schema.index( {date: 1}, { unique: true});

// 3. Create a Model.
const HullEntryModel = model<HullEntry>('HullEntry', schema);
export { HullEntryModel, HullEntry };
