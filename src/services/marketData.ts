const TradingView = require('@mathieuc/tradingview');

interface Quote {
    value: number;
    datetime: number;
}

export class MarketData {

    client: any;
    latestQuotes = new Map<string, Quote>();
    delayed: boolean = true;

    constructor() {
        this.client = new TradingView.Client(); 
    }

    subscribe(symbol: string): void {
        const quoteSession = new this.client.Session.Quote();

        const quoteMarket = new quoteSession.Market(symbol);
        quoteMarket.onData(async (data: any) => {
          this.latestQuotes.set(data.pro_name, {value: data.lp, datetime: data.lp_time});
          if (data.update_mode && data.update_mode.includes('delayed')) {
            this.delayed = true;
          }
        });
    }

    latestQuote(symbol: string): Quote {
        return this.latestQuotes.get(symbol);
    }

    isDelay(): boolean {
      return this.delayed;
    }

    async login(): Promise<void> {
      try {
        const user = await TradingView.loginUser(encodeURIComponent(process.env.TV_USER), encodeURIComponent(process.env.TV_PASS), false);
        console.log('User:', user);
        console.log('Sessionid:', user.session);
        console.log('Signature:', user.signature);
      } catch(e) {
        console.log(e);
      }
      
    }

}

