import { WebhookClient, EmbedBuilder } from 'discord.js';
import got from 'got';

const getHoldings = async (title: string, url: string, webhook: WebhookClient): Promise<void> => {
    got(url).then( (response) => {
        const backtestData = JSON.parse(response.body);
        const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x00FFFF)

        backtestData.positions.forEach((element:any) => {
            embed.addFields(
                { name: 'Pos', value: `${element.name}`},
                { name: 'Size', value: `${element.size}`},
                { name: 'Price', value: `${element.price}`},
            );
        });
        webhook.send({
            embeds: [embed],
        });
    });
}

export const updateHoldings = async (webhook: WebhookClient): Promise<void> => {

    await getHoldings('EOM Effects', `${process.env.DASHBOARD_URL}/backtest/execute/eom/eom`, webhook);
    await getHoldings('Window Dressing', `${process.env.DASHBOARD_URL}/backtest/execute/windowdressing`, webhook);
    await getHoldings('Vix Basis', `${process.env.DASHBOARD_URL}/backtest/execute/vixbasis`, webhook);
}