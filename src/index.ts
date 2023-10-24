import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import { routes } from './routes';
import { connect } from 'mongoose';
import { WebhookClient } from 'discord.js';
import { scheduleJob } from 'node-schedule';
import { updateVXCalenderData, updateVXData } from './services/onCloseUpdate';
import { updateHoldings } from './services/updateHoldings';
import * as CometdNodejsClient from 'cometd-nodejs-client'
import NodeCache from 'node-cache';

const helmet = require('helmet')

require('dotenv').config();

CometdNodejsClient.adapt()

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

  const PORT = process.env.PORT || 80;
  const server = app.listen(PORT, () => {
      const address = server.address();
      console.log("server is listening at", address);
  });


const webhookClient = new WebhookClient({ url: process.env.WEB_HOOK_URL });

scheduleJob({ rule: '55 14 * * 1-5', tz: 'America/Chicago' }, async () => {
    console.log(`${Date.now()} update vx data`);
    const vxdata = await updateVXData();
    await updateVXCalenderData();

  });

  scheduleJob({ rule: '30 14 * * 1-5', tz: 'America/Chicago' }, async () => {
    console.log(`${Date.now()} update vx data`);

    await updateHoldings(webhookClient);
  });

