"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCSV = void 0;
const parse_1 = require("@fast-csv/parse");
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = require("mongoose");
const vxModel_1 = require("../../src/vxModel");
require('dotenv').config();
const parseCSV = (path) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const results = [];
        fs_1.default.createReadStream(path)
            .pipe((0, parse_1.parse)({ headers: true }))
            .on('error', error => console.error(error))
            .on('data', row => results.push(row))
            .on('end', (rowCount) => {
            resolve(results);
        });
    });
});
exports.parseCSV = parseCSV;
const parseNumber = (value) => {
    const num = Number(value);
    if (isNaN(num)) {
        return -1;
    }
    return num;
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const databaseAcess = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSER}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
        yield (0, mongoose_1.connect)(databaseAcess, {});
        yield vxModel_1.VXEntryModel.deleteMany({});
        const vxdata = yield (0, exports.parseCSV)('./data/vx_data.csv');
        for (let i = 0; i < vxdata.length; i++) {
            const value = vxdata[i];
            const doc = new vxModel_1.VXEntryModel({
                date: new Date(value.date),
                premium: parseNumber(value.premium),
                premium_mean: parseNumber(value.premium_mean),
                premium_sd: parseNumber(value.premium_sd),
                premium_zscore: parseNumber(value.premium_zscore),
                VIX: parseNumber(value.VIX),
                VIX3M: parseNumber(value.VIX3M),
                vx1: parseNumber(value.vx1),
                vx1_DTE: parseNumber(value.vx1_DTE),
                vx1_weight_30: parseNumber(value.vx1_weight_30),
                vx2: parseNumber(value.vx2),
                vx2_DTE: parseNumber(value.vx2_DTE),
                vx2_weight_30: parseNumber(value.vx2_weight_30),
                vx30: parseNumber(value.vx30),
                vx30_tr: parseNumber(value.vx30_tr)
            });
            try {
                yield doc.save();
            }
            catch (e) {
                console.error('failed to save vx entry', e);
            }
        }
    });
}
main().then(() => {
    console.log('done');
});
//# sourceMappingURL=index.js.map