"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VXContractEntryModel = void 0;
const mongoose_1 = require("mongoose");
// 2. Create a Schema corresponding to the document interface.
const schema = new mongoose_1.Schema({
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
schema.index({ date: 1, name: 1 }, { unique: true });
// 3. Create a Model.
const VXContractEntryModel = (0, mongoose_1.model)('VXContractEntry', schema);
exports.VXContractEntryModel = VXContractEntryModel;
//# sourceMappingURL=vxContracts.js.map