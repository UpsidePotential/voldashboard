import { WebhookClient, EmbedBuilder } from 'discord.js';
import got from 'got';

const getVixMegaFactors = async (webhook: WebhookClient[]): Promise<void> => {
    if(process.env.NODE_ENV === 'development') {
        return;
    }
    const rvolData = await got(`${process.env.DASHBOARD_URL}/vixmultistrat`);
    const vixmegadata = JSON.parse(rvolData.body);

    const embed = new EmbedBuilder()
    .setTitle('VIX Mega Trend')
    .setColor(0x00FFFF)

    const latest = vixmegadata.data[vixmegadata.data.length-1];
    embed.addFields(
        { name: 'VIX MegaFactor', value: `${latest.vx30_basis_with_vvol}`},
        { name: 'Sizing', value: `${latest.bins30}`},
        { name: 'VX30 Basis Signal', value: `${latest.vx30_basis_signal_seasonal}`},
        { name: 'VVOL Signal', value: `${latest.vvol_strategy}`},
        { name: 'Premium Z-Score', value: `${latest.premium_zscore}`},
        { name: 'VX30 Carry', value: `${latest.logslope30}`},
        { name: 'Vvol', value: `${latest.vvol}`},
    );
    
    webhook.forEach(hook => {
        hook.send({
            embeds: [embed],
        });
    });
}

const getHoldings = async (title: string, url: string, webhook: WebhookClient[]): Promise<void> => {

    if(process.env.NODE_ENV === 'development') {
        return;
    }

    got(url).then( (response) => {
        const backtestData = JSON.parse(response.body);
        const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x00FFFF)

        backtestData.positions.forEach((element:any) => {
            embed.addFields(
                { name: 'Pos', value: `${element.name}`},
                { name: 'Price', value: `${element.price}`},
            );
        });
        webhook.forEach(hook => {
            hook.send({
                embeds: [embed],
            });
        });;
    });
}

export const updateHoldings = async (webhook: WebhookClient[]): Promise<void> => {

    await getHoldings('EOM Effects', `${process.env.DASHBOARD_URL}/backtest/execute/eom/eom`, webhook);
    await getHoldings('Window Dressing', `${process.env.DASHBOARD_URL}/backtest/execute/windowdressing`, webhook);
    await getHoldings('Vix Basis', `${process.env.DASHBOARD_URL}/backtest/execute/vixbasis`, webhook);
    await getVixMegaFactors(webhook);
}