import { Schema, model } from 'mongoose';

interface VIXOptionEntry {
  strike: string;
  oi: number;
  delta: number;
  ask: number;
  bid: number;
}

interface Expiration {
  date: number;
  options: [VIXOptionEntry]
}

// 1. Create an interface representing a document in MongoDB.
interface VIXOptionChain {
    date: number;
    expirations: [Expiration];
}

// 2. Create a Schema corresponding to the document interface.
const schema = new Schema<VIXOptionChain>({
  date: { type: Number, required: true },
  expirations: [ {
    date: { type: Number, required: true },
    options: [ {
      strike: { type: String, required: true },
      oi: { type: Number, required: true },
      delta: { type: Number, required: true },
      bid: { type: Number, required: true },
      ask: { type: Number, required: true },
    }]
  }],
});

schema.index( {date: 1}, { unique: true});

// 3. Create a Model.
const VIXOptionChainEntryModel = model<VIXOptionChain>('VIXOptionChainEntry', schema);
export { VIXOptionChainEntryModel, VIXOptionChain, Expiration, VIXOptionEntry  };
