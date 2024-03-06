"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VXSpreadEntryModel = void 0;
const mongoose_1 = require("mongoose");
// 2. Create a Schema corresponding to the document interface.
const schema = new mongoose_1.Schema({
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
schema.index({ date: 1, name: 1 }, { unique: true });
// 3. Create a Model.
const VXSpreadEntryModel = (0, mongoose_1.model)('VXSpreadEntry', schema);
exports.VXSpreadEntryModel = VXSpreadEntryModel;
//# sourceMappingURL=vxSpread.js.map