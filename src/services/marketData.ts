import axios from "axios";
import os from "os";

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
      const remember = false;
      const validateStatus = (status: any) => status < 500;
      const UA = 'TWAPI/3.0'
      try {
        const { data, headers } = await axios.post(
          'https://www.tradingview.com/accounts/signin/',
          `username=${encodeURIComponent(process.env.TV_USER)}&password=${encodeURIComponent(process.env.TV_PASS)}${remember ? '&remember=on' : ''}`,
          {
            validateStatus,
            headers: {
              referer: 'https://www.tradingview.com',
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-agent': `${UA} (${os.version()}; ${os.platform()}; ${os.arch()})`,
            },
          },
        );

        console.log(headers);
        console.log(data);
    
        const cookies = headers['set-cookie'];
    
        if (data.error) throw new Error(data.error);
    
        const sessionCookie = cookies.find((c) => c.includes('sessionid='));
        const session = (sessionCookie.match(/sessionid=(.*?);/) ?? [])[1];
    
        const signCookie = cookies.find((c) => c.includes('sessionid_sign='));
        const signature = (signCookie.match(/sessionid_sign=(.*?);/) ?? [])[1];

        console.log(`session: ${session} sig: ${signature}`)


      } catch(e) {
        console.log(e);
      }
      
    }

}

