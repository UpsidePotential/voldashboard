import { Schema, model } from 'mongoose';

// 1. Create an interface representing a document in MongoDB.
interface VXContractEntry {
    date: number;
    name: string;
    open: number;
    close: number;
    expiry: number;
    volume: number;
    openinterest: number;
    c2c_logreturn: number;
    dte: number;
    contract: number;
}

// 2. Create a Schema corresponding to the document interface.
const schema = new Schema<VXContractEntry>({
  date: { type: Number, required: true },
  name: { type: String, required: true },
  open: { type: Number, required: true },
  close: { type: Number, required: true },
  expiry: { type: Number, required: true },
  volume: { type: Number, required: true },
  openinterest: { type: Number, required: true },
  c2c_logreturn: { type: Number, required: true },  
  dte: { type: Number, required: true }, 
  contract: { type: Number, required: true }, 
});

schema.index( {date: 1, name: 1}, { unique: true});

// 3. Create a Model.
const VXContractEntryModel = model<VXContractEntry>('VXContractEntry', schema);
export { VXContractEntryModel, VXContractEntry };
