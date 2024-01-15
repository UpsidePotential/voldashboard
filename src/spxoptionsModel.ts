import { Schema, model } from 'mongoose';

interface SPXOptionEntry {
  strike: string;
  oi: number;
  delta: number;
  ask: number;
  bid: number;
  iv: number;
}

interface Expiration {
  date: number;
  options: [SPXOptionEntry]
}

// 1. Create an interface representing a document in MongoDB.
interface SPXOptionChain {
    date: number;
    expirations: [Expiration];
}

// 2. Create a Schema corresponding to the document interface.
const schema = new Schema<SPXOptionChain>({
  date: { type: Number, required: true },
  expirations: [ {
    date: { type: Number, required: true },
    options: [ {
      strike: { type: String, required: true },
      oi: { type: Number, required: true },
      delta: { type: Number, required: true },
      bid: { type: Number, required: true },
      ask: { type: Number, required: true },
      iv: { type: Number, required: true },
    }]
  }],
});

schema.index( {date: 1}, { unique: true});

// 3. Create a Model.
const SPXOptionChainEntryModel = model<SPXOptionChain>('SPXOptionChainEntry', schema);
export { SPXOptionChainEntryModel, SPXOptionChain, Expiration, SPXOptionEntry  };
