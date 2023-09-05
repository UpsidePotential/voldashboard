import { Router } from 'express';
import got from 'got';

export const stockbond = Router();

stockbond.get('/stockbond', async (req, res) => {
    const rvolData = await got(`${process.env.DASHBOARD_URL}/stock_bond`);
    const data = JSON.parse(rvolData.body);
    const currentMonth = data.returns[data.returns.length -1];
    const previousMonth = data.returns[data.returns.length -2];
    const currentTradingDay = data.currentTradingDay;
    const tradingDaysInMonth = data.tradingDaysInMonth;
    let position = "None";

    //who out performed last month???  Be long the other for the first 5 days of the next month.
    // for the last 5 days of the current month be long the under performer.
    let previousMonthEquitiesOutPerform = false;
    if(previousMonth.SPY > previousMonth.TLT)
        previousMonthEquitiesOutPerform = true

    let currentMonthEquitiesOutPerform = false;
    if(currentMonth.SPY > currentMonth.TLT)
        currentMonthEquitiesOutPerform = true

    if(currentTradingDay <= 5)
        position = previousMonthEquitiesOutPerform ? "SPY" : "TLT"
    else if(tradingDaysInMonth - currentTradingDay < 5)
        position = currentMonthEquitiesOutPerform ? "SPY" : "TLT"

    res.render('stockbond', {data: {
        currentMonth,
        previousMonth,
        currentTradingDay,
        tradingDaysInMonth,
        position
    }});
})
