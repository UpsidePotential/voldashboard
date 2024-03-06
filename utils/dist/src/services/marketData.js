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
exports.MarketData = void 0;
const axios_1 = __importDefault(require("axios"));
const os_1 = __importDefault(require("os"));
const TradingView = require('@mathieuc/tradingview');
class MarketData {
    constructor() {
        this.latestQuotes = new Map();
        this.delayed = true;
        this.client = new TradingView.Client();
    }
    subscribe(symbol) {
        const quoteSession = new this.client.Session.Quote();
        const quoteMarket = new quoteSession.Market(symbol);
        quoteMarket.onData((data) => __awaiter(this, void 0, void 0, function* () {
            this.latestQuotes.set(data.pro_name, { value: data.lp, datetime: data.lp_time });
            if (data.update_mode && data.update_mode.includes('delayed')) {
                this.delayed = true;
            }
        }));
    }
    latestQuote(symbol) {
        return this.latestQuotes.get(symbol);
    }
    isDelay() {
        return this.delayed;
    }
    login() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const remember = false;
            const validateStatus = (status) => status < 500;
            const UA = 'TWAPI/3.0';
            try {
                const { data, headers } = yield axios_1.default.post('https://www.tradingview.com/accounts/signin/', `username=${encodeURIComponent(process.env.TV_USER)}&password=${encodeURIComponent(process.env.TV_PASS)}${remember ? '&remember=on' : ''}`, {
                    validateStatus,
                    headers: {
                        referer: 'https://www.tradingview.com',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-agent': `${UA} (${os_1.default.version()}; ${os_1.default.platform()}; ${os_1.default.arch()})`,
                    },
                });
                console.log(headers);
                console.log(data);
                const cookies = headers['set-cookie'];
                if (data.error)
                    throw new Error(data.error);
                const sessionCookie = cookies.find((c) => c.includes('sessionid='));
                const session = ((_a = sessionCookie.match(/sessionid=(.*?);/)) !== null && _a !== void 0 ? _a : [])[1];
                const signCookie = cookies.find((c) => c.includes('sessionid_sign='));
                const signature = ((_b = signCookie.match(/sessionid_sign=(.*?);/)) !== null && _b !== void 0 ? _b : [])[1];
                console.log(`session: ${session} sig: ${signature}`);
            }
            catch (e) {
                console.log(e);
            }
        });
    }
}
exports.MarketData = MarketData;
//# sourceMappingURL=marketData.js.map