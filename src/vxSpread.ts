import { Schema, model } from 'mongoose';

// 1. Create an interface representing a document in MongoDB.
interface VXSpreadEntry {
    date: number;
    name: string;
    level: number;
    front: number;
    back: number;
    dte: number;
    pointslope: number;
    logslope: number;
    logreturns: number;
}

// 2. Create a Schema corresponding to the document interface.
const schema = new Schema<VXSpreadEntry>({
  date: { type: Number, required: true },
  name: { type: String, required: true },
  level: { type: Number, required: true },
  front: { type: Number, required: true },
  back: { type: Number, required: true },
  dte: { type: Number, required: true },
  pointslope: { type: Number, required: true },
  logslope: { type: Number, required: true },
  logreturns: { type: Number, required: true },
});

schema.index( {date: 1, name: 1}, { unique: true});

// 3. Create a Model.
const VXSpreadEntryModel = model<VXSpreadEntry>('VXSpreadEntry', schema);
export { VXSpreadEntryModel, VXSpreadEntry };
