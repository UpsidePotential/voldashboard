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
const format_1 = require("@fast-csv/format");
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = require("mongoose");
const vxModel_1 = require("../../src/vxModel");
const vix_1 = require("../../src/vix");
const got_1 = __importDefault(require("got"));
const vxContracts_1 = require("../../src/vxContracts");
const vxSpread_1 = require("../../src/vxSpread");
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
const writetoCSV = (filename, data) => {
    const stream = (0, format_1.format)({ headers: true });
    const writeSteam = fs_1.default.createWriteStream(filename);
    stream.pipe(writeSteam);
    data.forEach(obj => {
        stream.write(obj);
    });
    stream.end();
};
const appendToCSVFile = (filePath, dataToAppend) => {
    // Check if the file exists
    let headers = false;
    if (!fs_1.default.existsSync(filePath)) {
        headers = true;
    }
    // Create a writable stream to append data to the file
    const writableStream = fs_1.default.createWriteStream(filePath, { flags: 'a' });
    // Create a CSV formatter
    const csvFormatter = (0, format_1.format)({ headers });
    // Pipe the CSV formatter to the writable stream
    csvFormatter.pipe(writableStream);
    // Write the new data to the CSV file
    dataToAppend.forEach((row) => {
        csvFormatter.write(row);
    });
    writableStream.write('\n');
    // End the CSV formatting and close the writable stream
    csvFormatter.end();
};
const appendOneToCSVFile = (filePath, dataToAppend) => {
    // Check if the file exists
    let headers = false;
    if (!fs_1.default.existsSync(filePath)) {
        headers = true;
    }
    // Create a writable stream to append data to the file
    const writableStream = fs_1.default.createWriteStream(filePath, { flags: 'a' });
    // Create a CSV formatter
    const csvFormatter = (0, format_1.format)({ headers });
    // Pipe the CSV formatter to the writable stream
    csvFormatter.pipe(writableStream);
    csvFormatter.write(dataToAppend);
    writableStream.write('\n');
    // End the CSV formatting and close the writable stream
    csvFormatter.end();
};
const parseNumber = (value) => {
    const num = Number(value);
    if (isNaN(num)) {
        return -1;
    }
    return num;
};
function uploadVxData() {
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
const fetchVixData = (date) => __awaiter(void 0, void 0, void 0, function* () {
    let retry = 0;
    while (retry < 5) {
        try {
            const endpoint = (0, vix_1.cboeVixEndpoint)(date);
            console.log(`endpoint: ${endpoint}`);
            const data = yield (0, got_1.default)(endpoint).json();
            data['reqDate'] = date;
            return data;
        }
        catch (ex) {
            retry++;
            date.setDate(date.getDate() - 1);
        }
    }
    throw new Error('Failed to fetch VIX Futures Data. Tried too many times');
});
function downloadSPXTermStructure() {
    return __awaiter(this, void 0, void 0, function* () {
        let date = new Date();
        while (true) {
            const data = yield fetchVixData(date);
            const prices = data.data.prices.reverse();
            if (prices.length == 0) {
                console.error('empty prices');
                continue;
            }
            console.log(data.reqDate);
            const spxData = data.data.expirations.map((element) => {
                const price = prices.find((n) => n.index_symbol == element.symbol);
                const expDate = new Date(element.expirationDate);
                expDate.setDate(expDate.getDate());
                return { time: data.reqDate.valueOf(), symbol: element.symbol, month: element.month, expDate: Date.parse(element.expirationDate), price: price.price };
            });
            let spxVix = {};
            // Iterate over the list of objects
            spxData.forEach((obj) => {
                if (obj.month < 6) {
                    spxVix['time'] = obj.time;
                    spxVix[`VIX${obj.month}_price`] = obj.price;
                    spxVix[`VIX${obj.month}_expDate`] = obj.expDate;
                }
            });
            // write to a csv file
            appendOneToCSVFile('spxVixData.csv', spxVix);
            date = new Date(data.reqDate);
            date.setDate(date.getDate() - 1);
        }
    });
}
function generateSPXVsVXData() {
    return __awaiter(this, void 0, void 0, function* () {
        const vxdata = yield (0, exports.parseCSV)('./data/vx_contracts.csv');
        const spxdata = yield (0, exports.parseCSV)('./data/spxVixData.csv');
    });
}
function updateVxContracts() {
    return __awaiter(this, void 0, void 0, function* () {
        const databaseAcess = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSER}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
        yield (0, mongoose_1.connect)(databaseAcess, {});
        yield vxContracts_1.VXContractEntryModel.deleteMany({});
        const vxdata = yield (0, exports.parseCSV)('./data/vx_contracts.csv');
        for (let i = 0; i < vxdata.length; i++) {
            const value = vxdata[i];
            const doc = new vxContracts_1.VXContractEntryModel({
                date: new Date(value.date),
                name: value.ticker,
                open: parseNumber(value.open),
                close: parseNumber(value.close),
                expiry: new Date(value.expiry),
                volume: parseNumber(value.volume),
                openinterest: parseNumber(value['open_interest']),
                c2c_logreturn: parseNumber(value['c2c_logreturn']),
                dte: parseNumber(value.DTE),
                contract: parseNumber(value.contract),
            });
            try {
                yield doc.save();
            }
            catch (e) {
                console.error('failed to save vx contract', e);
            }
        }
    });
}
function updateVxSpreads() {
    return __awaiter(this, void 0, void 0, function* () {
        const databaseAcess = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSER}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
        yield (0, mongoose_1.connect)(databaseAcess, {});
        yield vxSpread_1.VXSpreadEntryModel.deleteMany({});
        const vxdata = yield (0, exports.parseCSV)('./data/spreads.csv');
        for (let i = 0; i < vxdata.length; i++) {
            const value = vxdata[i];
            const doc = new vxSpread_1.VXSpreadEntryModel({
                date: new Date(value.date),
                name: value.spread,
                level: parseNumber(value.level),
                front: parseNumber(value.front),
                back: parseNumber(value.back),
                dte: parseNumber(value.DTE),
                pointslope: parseNumber(value.pointslope),
                logslope: parseNumber(value.logslope),
                logreturns: parseNumber(value.logreturns),
            });
            try {
                yield doc.save();
            }
            catch (e) {
                console.error('failed to save vx contract', e);
            }
        }
    });
}
downloadSPXTermStructure().then(() => {
    console.log('finished vx contracts');
});
//# sourceMappingURL=index.js.map