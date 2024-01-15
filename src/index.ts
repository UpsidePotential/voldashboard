import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import { routes } from './routes';
import { connect } from 'mongoose';
import { WebhookClient } from 'discord.js';
import { scheduleJob } from 'node-schedule';
import { updateSPXOptionsData, updateVIXOptionsData, updateVXCalenderData, updateVXData } from './services/onCloseUpdate';
import { updateHoldings } from './services/updateHoldings';
import { MarketData } from './services/marketData';
import NodeCache from 'node-cache';
import { convertContractNameTV, getVXFuturesData } from './vix';


const helmet = require('helmet')

require('dotenv').config();

const cache = new NodeCache();

const app = express();
app.set('view engine', 'pug');
app.use(express.static('./assets'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compression());
helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "https://code.highcharts.com"],
      },
    },
  }) 
app.use('/', routes);


const databaseAcess = `mongodb+srv://${process.env.DB_USER
}:${process.env.DB_PASS
}@${process.env.DB_CLUSER
}.mongodb.net/${process.env.DB_NAME
}?retryWrites=true&w=majority`;

connect(databaseAcess, {}).then( value => {
    console.log('connected to mongo');
});


  app.locals.nodeCache = cache;
  app.locals.marketData = new MarketData();

  const PORT = process.env.PORT || 80;
  const server = app.listen(PORT, () => {
      const address = server.address();
      console.log("server is listening at", address);
  });


const webhookClient = [ 
  new WebhookClient({ url: process.env.WEB_HOOK_URL }), 
  new WebhookClient({ url: process.env.WEB_HOOK_URL2 })
]

app.locals.marketData.subscribe('CBOE:VIX');
app.locals.marketData.subscribe('CBOE:VIX3M');
app.locals.marketData.subscribe('CBOE:SPX');

getVXFuturesData().then( (futures: any[]) => {
  futures.forEach( future => { 
    app.locals.marketData.subscribe(convertContractNameTV(future.symbol));
  });
});

scheduleJob({ rule: '55 14 * * 1-5', tz: 'America/Chicago' }, async () => {
    console.log(`${Date.now()} update vx data`);
    const vxdata = await updateVXData(app.locals.marketData);
    await updateVXCalenderData();
    await updateVIXOptionsData();
    await updateSPXOptionsData();

  });

  scheduleJob({ rule: '59 14 * * 1-5', tz: 'America/Chicago' }, async () => {
    console.log(`${Date.now()} update holdings`);

    await updateHoldings(webhookClient);
  });

