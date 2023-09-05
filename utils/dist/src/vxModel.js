"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VXEntryModel = void 0;
const mongoose_1 = require("mongoose");
// 2. Create a Schema corresponding to the document interface.
const schema = new mongoose_1.Schema({
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
schema.index({ date: 1 }, { unique: true });
// 3. Create a Model.
const VXEntryModel = (0, mongoose_1.model)('VXEntry', schema);
exports.VXEntryModel = VXEntryModel;
//# sourceMappingURL=vxModel.js.map