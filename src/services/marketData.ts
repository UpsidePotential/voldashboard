const TradingView = require('@mathieuc/tradingview');

interface Quote {
    value: number;
    datetime: number;
}

export class MarketData {

    client: any;
    latestQuotes = new Map<string, Quote>();

    constructor() {
        this.client = new TradingView.Client({token: process.env.TV_TOKEN, signature: process.env.TV_SIG}); 
    }

    subscribe(symbol: string): void {
        const quoteSession = new this.client.Session.Quote();

        const quoteMarket = new quoteSession.Market(symbol);
        quoteMarket.onData(async (data: any) => {
          this.latestQuotes.set(data.original_name, {value: data.lp, datetime: data.lp_time});
        });
    }

    latestQuote(symbol: string): Quote {
        return this.latestQuotes.get(symbol);
    }

}

