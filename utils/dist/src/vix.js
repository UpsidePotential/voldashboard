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
exports.parseOptionsCode = exports.VixTsunami = exports.vixbasis = exports.SPXVRP = exports.SPXRealizedVol = exports.rollYield = exports.calculateContango = exports.buildVXSpreads = exports.buildVXData = exports.recalculateStandardDeviation = exports.rollingZScore = exports.simpleMovingStdDev = exports.simpleMovingAverage = exports.humanVXName = exports.vxContractDTE = exports.getNumberOfDays = exports.contractWeight = exports.contractWeightTW = exports.convertContractNameTV = exports.convertContractName = exports.getVXFuturesData = exports.getVIXData = exports.spxOptionsChain = exports.vixOptionsChain = exports.cboeVixEndpoint = void 0;
const got_1 = __importDefault(require("got"));
const cboeVixEndpoint = (date) => {
    const year = date.getFullYear();
    // JavaScript months are 0-indexed, so we add 1 to get the correct month
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `https://cdn.cboe.com/api/global/delayed_quotes/term_structure/${year}/VIX_${year}-${month}-${day}.json`;
};
exports.cboeVixEndpoint = cboeVixEndpoint;
const vixOptionsChain = () => __awaiter(void 0, void 0, void 0, function* () {
    return (0, got_1.default)('https://cdn.cboe.com/api/global/delayed_quotes/options/_VIX.json').json();
});
exports.vixOptionsChain = vixOptionsChain;
const spxOptionsChain = () => __awaiter(void 0, void 0, void 0, function* () {
    return (0, got_1.default)('https://cdn.cboe.com/api/global/delayed_quotes/options/_SPX.json').json();
});
exports.spxOptionsChain = spxOptionsChain;
const fetchVixData = () => __awaiter(void 0, void 0, void 0, function* () {
    let retry = 0;
    const date = new Date();
    while (retry < 5) {
        try {
            return yield (0, got_1.default)((0, exports.cboeVixEndpoint)(date)).json();
        }
        catch (ex) {
            retry++;
            date.setDate(date.getDate() - 1);
        }
    }
    throw new Error('Failed to fetch VIX Futures Data. Tried too many times');
});
const getVIXData = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield fetchVixData();
    const prices = result.data.prices.reverse();
    if (prices.length == 0) {
        return [];
    }
    return result.data.expirations.map((element) => {
        const price = prices.find((n) => n.index_symbol == element.symbol);
        const expDate = new Date(element.expirationDate);
        expDate.setDate(expDate.getDate());
        return { symbol: element.symbol, mounth: element.month, expDate: Date.parse(element.expirationDate), price: price.price };
    });
});
exports.getVIXData = getVIXData;
const getVXFuturesData = () => __awaiter(void 0, void 0, void 0, function* () {
    const vxData = yield (0, got_1.default)('https://www.cboe.com/us/futures/api/get_quotes_combined/?symbol=VX&rootsymbol=null').json();
    return vxData.data.filter((x) => x.symbol.length == 5);
});
exports.getVXFuturesData = getVXFuturesData;
const convertContractName = (name) => {
    // cboe name 'VX/Z3'
    // rw name 'VX-2024M'
    const monthCode = name.charAt(3);
    const yearCode = name.charAt(4);
    // lol this is a 2029 problem, see you then
    const yearBase = new Date().getFullYear().toString().slice(0, -1);
    return `VX-${yearBase}${yearCode}${monthCode}`;
};
exports.convertContractName = convertContractName;
const convertContractNameTV = (name) => {
    // cboe name 'VX/Z3'
    // TV name 'CBOE:VXF2024'
    const monthCode = name.charAt(3);
    const yearCode = name.charAt(4);
    // lol this is a 2029 problem, see you then
    const yearBase = new Date().getFullYear().toString().slice(0, -1);
    return `CBOE:VX${monthCode}${yearBase}${yearCode}`;
};
exports.convertContractNameTV = convertContractNameTV;
const contractWeightTW = (vx1, vx2) => {
    const vx1DTE = (0, exports.vxContractDTE)(vx1);
    const vx2DTE = (0, exports.vxContractDTE)(vx2);
    let vx1_30Weight = 0;
    let vx2_30Weight = 0;
    if (vx1DTE >= 30) {
        vx1_30Weight = 1.0;
    }
    else {
        const vx1Dist = Math.abs(vx1DTE - 30);
        const vx2Dist = Math.abs(vx2DTE - 30);
        const sum = (vx1Dist + vx2Dist);
        vx1_30Weight = (sum - vx1Dist) / sum;
        vx2_30Weight = (sum - vx2Dist) / sum;
    }
    return { vx1DTE, vx2DTE, vx1_30Weight, vx2_30Weight };
};
exports.contractWeightTW = contractWeightTW;
const contractWeight = (vx1, vx2) => {
    const date = new Date();
    const vx1DTE = (0, exports.getNumberOfDays)(date, vx1);
    const vx2DTE = (0, exports.getNumberOfDays)(date, vx2);
    let vx1_30Weight = 0;
    let vx2_30Weight = 0;
    if (vx1DTE >= 30) {
        vx1_30Weight = 1.0;
    }
    else {
        const vx1Dist = Math.abs(vx1DTE - 30);
        const vx2Dist = Math.abs(vx2DTE - 30);
        const sum = (vx1Dist + vx2Dist);
        vx1_30Weight = (sum - vx1Dist) / sum;
        vx2_30Weight = (sum - vx2Dist) / sum;
    }
    return { vx1DTE, vx2DTE, vx1_30Weight, vx2_30Weight };
};
exports.contractWeight = contractWeight;
const getNumberOfDays = (start, end) => {
    const date1 = new Date(start);
    const date2 = new Date(end);
    // One day in milliseconds
    const oneDay = 1000 * 60 * 60 * 24;
    // Calculating the time difference between two dates
    const diffInTime = date2.getTime() - date1.getTime();
    // Calculating the no. of days between two dates
    const diffInDays = Math.round(diffInTime / oneDay);
    return diffInDays;
};
exports.getNumberOfDays = getNumberOfDays;
const vxContractDTE = (contract) => {
    const date = new Date();
    const expDate = new Date(contract['expiration-date']);
    return (0, exports.getNumberOfDays)(date, expDate);
};
exports.vxContractDTE = vxContractDTE;
const humanVXName = (vxContract) => {
    return vxContract.slice(1, 6);
};
exports.humanVXName = humanVXName;
const simpleMovingAverage = (prices, interval) => {
    let index = interval - 1;
    const length = prices.length + 1;
    let results = [];
    while (index < length) {
        index = index + 1;
        const intervalSlice = prices.slice(index - interval, index);
        const sum = intervalSlice.reduce((prev, curr) => prev + curr, 0);
        results.push(sum / interval);
    }
    return results;
};
exports.simpleMovingAverage = simpleMovingAverage;
const simpleMovingStdDev = (arr, windowSize) => {
    const result = [];
    let sum = 0;
    let sumOfSquares = 0;
    // Calculate the sum and sum of squares for the initial window
    for (let i = 0; i < windowSize; i++) {
        sum += arr[i][1];
        sumOfSquares += arr[i][1] * arr[i][1];
    }
    //result.push([0, Math.sqrt((sumOfSquares - (sum * sum) / windowSize) / windowSize)]);
    // Calculate the rolling standard deviation for the remaining elements
    for (let i = windowSize; i < arr.length; i++) {
        sum += arr[i][1] - arr[i - windowSize][1];
        sumOfSquares += arr[i][1] * arr[i][1] - arr[i - windowSize][1] * arr[i - windowSize][1];
        result.push([arr[i][0], Math.sqrt((sumOfSquares - (sum * sum) / windowSize) / windowSize)]);
    }
    return result;
};
exports.simpleMovingStdDev = simpleMovingStdDev;
const rollingZScore = (arr, windowSize) => {
    if (arr.length <= windowSize) {
        throw new Error("Array length should be greater than the window size.");
    }
    const result = [];
    let sum = 0;
    let sumOfSquares = 0;
    // Calculate the sum and sum of squares for the initial window
    for (let i = 0; i < windowSize; i++) {
        sum += arr[i][1];
        sumOfSquares += arr[i][1] * arr[i][1];
    }
    const mean = sum / windowSize;
    const stdDev = Math.sqrt((sumOfSquares - (sum * sum) / windowSize) / windowSize);
    //result.push([0, (arr[0][1] - mean) / stdDev]);
    // Calculate the rolling Z-score for the remaining elements
    for (let i = windowSize; i < arr.length; i++) {
        sum += arr[i][1] - arr[i - windowSize][1];
        sumOfSquares += arr[i][1] * arr[i][1] - arr[i - windowSize][1] * arr[i - windowSize][1];
        const newMean = sum / windowSize;
        const newStdDev = Math.sqrt((sumOfSquares - (sum * sum) / windowSize) / windowSize);
        result.push([arr[i][0], (arr[i][1] - newMean) / newStdDev]);
    }
    return result;
};
exports.rollingZScore = rollingZScore;
const recalculateStandardDeviation = (existingStandardDeviation, datasetSize, existingMean, newDataValue) => {
    const newDatasetSize = datasetSize + 1;
    const delta = newDataValue - existingMean;
    const newMean = existingMean + delta / newDatasetSize;
    const newVariance = ((datasetSize * existingStandardDeviation * existingStandardDeviation) +
        (delta * (newDataValue - newMean))) / newDatasetSize;
    const newStandardDeviation = Math.sqrt(newVariance);
    return newStandardDeviation;
};
exports.recalculateStandardDeviation = recalculateStandardDeviation;
const buildVXData = (marketData, historicalvxData) => __awaiter(void 0, void 0, void 0, function* () {
    const fromDate = new Date();
    const toDate = new Date();
    fromDate.setDate(fromDate.getDate() - 5);
    const vxFutsData = yield (0, exports.getVXFuturesData)();
    const vix = marketData.latestQuote('CBOE:VIX').value;
    const vix3m = marketData.latestQuote('CBOE:VIX3M').value;
    const vx1 = marketData.latestQuote((0, exports.convertContractNameTV)(vxFutsData[0].symbol)).value;
    const vx2 = marketData.latestQuote((0, exports.convertContractNameTV)(vxFutsData[1].symbol)).value;
    const lastVXData = historicalvxData[historicalvxData.length - 1];
    const weights = (0, exports.contractWeight)(vxFutsData[0].expiration, vxFutsData[1].expiration);
    const vx30 = (vx1 * weights.vx1_30Weight) + (vx2 * weights.vx2_30Weight);
    const premium = Math.log(vx30 / vix3m);
    const premium_mean = ((lastVXData.premium_mean * 252) + premium) / 253;
    const premium_sd = (0, exports.recalculateStandardDeviation)(lastVXData.premium_sd, 252, lastVXData.premium_mean, premium);
    const premium_zscore = (premium - premium_mean) / premium_sd;
    // take last vxData in the historical data set.
    const vxData = {
        date: toDate.valueOf(),
        premium,
        premium_mean,
        premium_sd,
        premium_zscore,
        VIX: vix,
        VIX3M: vix3m,
        vx1: vx1,
        vx1_DTE: weights.vx1DTE,
        vx1_weight_30: weights.vx1_30Weight,
        vx2: vx2,
        vx2_DTE: weights.vx2DTE,
        vx2_weight_30: weights.vx2_30Weight,
        vx30,
        vx30_tr: 0,
    };
    return vxData;
});
exports.buildVXData = buildVXData;
const buildVxPair = (a, b, name) => {
    const level = (a.last_price + b.last_price) * 0.5;
    const front = a.last_price;
    const back = b.last_price;
    const pointslope = a.last_price - b.last_price;
    const logslope = Math.log(a.last_price / b.last_price);
    return {
        date: new Date().valueOf(),
        name,
        level,
        front,
        back,
        dte: (0, exports.getNumberOfDays)(new Date(), new Date(a.expiration)),
        pointslope,
        logslope,
        logreturns: Math.log(b.last_price / b.prev_close) - Math.log(a.last_price / a.prev_close),
    };
};
const buildVXSpreads = (vxfutures) => {
    const calenders = [];
    calenders.push(buildVxPair(vxfutures[0], vxfutures[1], "vx12"));
    calenders.push(buildVxPair(vxfutures[1], vxfutures[2], "vx23"));
    calenders.push(buildVxPair(vxfutures[2], vxfutures[3], "vx34"));
    calenders.push(buildVxPair(vxfutures[3], vxfutures[4], "vx45"));
    //calenders.push(buildVxPair(vxfutures[4], vxfutures[5], "vx56"));
    return calenders;
};
exports.buildVXSpreads = buildVXSpreads;
const calculateContango = (currentPrice, nextPrice) => {
    const contango = ((nextPrice - currentPrice) / currentPrice);
    return contango;
};
exports.calculateContango = calculateContango;
const rollYield = (currentPrice, nextPrice, daysToExpiry) => {
    return (nextPrice - currentPrice) / (currentPrice * daysToExpiry);
};
exports.rollYield = rollYield;
const SPXRealizedVol = () => __awaiter(void 0, void 0, void 0, function* () {
    const rvolData = yield (0, got_1.default)(`${process.env.DASHBOARD_URL}/realized_vol_term/json/^spx`);
    return JSON.parse(rvolData.body);
});
exports.SPXRealizedVol = SPXRealizedVol;
const SPXVRP = () => __awaiter(void 0, void 0, void 0, function* () {
    const rvolData = yield (0, got_1.default)(`${process.env.DASHBOARD_URL}/vrp/json`);
    return JSON.parse(rvolData.body);
});
exports.SPXVRP = SPXVRP;
const vixbasis = () => __awaiter(void 0, void 0, void 0, function* () {
    const rvolData = yield (0, got_1.default)(`${process.env.DASHBOARD_URL}/vixBasis`);
    return JSON.parse(rvolData.body);
});
exports.vixbasis = vixbasis;
const VixTsunami = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield (0, got_1.default)(`${process.env.DASHBOARD_URL}/vixtsunami`);
    const vixtsunamidata = JSON.parse(data.body).data;
    let SellSignal = null;
    let LongSignal = null;
    let VvixSignal = null;
    for (let i = vixtsunamidata.length - 1; i >= 0; i--) {
        if (!SellSignal && vixtsunamidata[i].sell_signal === 1) {
            const date = new Date(vixtsunamidata[i].Date);
            SellSignal = date.toISOString().split('T')[0];
        }
        if (!LongSignal && vixtsunamidata[i].long_signal === 1) {
            const date = new Date(vixtsunamidata[i].Date);
            LongSignal = date.toISOString().split('T')[0];
        }
        if (!VvixSignal && vixtsunamidata[i].signal_vvix === 1) {
            const date = new Date(vixtsunamidata[i].Date);
            VvixSignal = date.toISOString().split('T')[0];
        }
        if (SellSignal && LongSignal && VvixSignal) {
            break;
        }
    }
    return { SellSignal, LongSignal, VvixSignal };
});
exports.VixTsunami = VixTsunami;
const parseOptionsCode = (option) => {
    // const underlyingSymbol = option.substring(0, 3);
    const expirationDate = option.substring(3, 9);
    const optionType = option.charAt(9);
    const strikePrice = option.substring(10, 15);
    const date = new Date(expirationDate.replace(/(\d{2})(\d{2})(\d{2})/, '20$1-$2-$3')).valueOf();
    //const strikeString = option.substring(optionscode.length)
    // Strike Price (#####.###) listed with five digits before the decimal and three digits following the decimal
    const strike = parseFloat(strikePrice.substring(0, 5) + '.' + strikePrice.substring(5));
    return { exp: date, strike, type: optionType };
};
exports.parseOptionsCode = parseOptionsCode;
//# sourceMappingURL=vix.js.map