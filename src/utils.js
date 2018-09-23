const Maker = require("@makerdao/dai");

module.exports = {
  init,
  balanceCDP,
  getSaveCollateralizationRatio,
};

/**
 * Creates and authenticates Dai.JS instance
 */
async function init() {
  if (!process.env.WEB3_PRIV_KEY) {
    throw new Error("WEB3_PRIV_KEY env var missing! Set it to your private key");
  }

  const maker = Maker.create("kovan", {
    privateKey: process.env.WEB3_PRIV_KEY,
  });
  
  await maker.authenticate();

  return maker;
}

/**
 * Draw or wipe DAI to match save collateralization ratio (defined below)
 */
async function balanceCDP(maker, cdp) {
  const saveCollateralizationRatio = await getSaveCollateralizationRatio(maker);

  const daiCollateralValue = await cdp.getCollateralValue(Maker.USD);
  const daiDebt = await cdp.getDebtValue(Maker.USD);

  const saveDaiToPull = daiCollateralValue.div(saveCollateralizationRatio);

  if (saveDaiToPull.lt(daiDebt)) {
    const daiDifference = daiDebt.minus(saveDaiToPull);
    console.log(`Paying back DAI: ${daiDifference.toString()}`);

    await cdp.wipeDai(daiDifference, Maker.DAI);
  } else {
    const daiDifference = saveDaiToPull.minus(daiDebt);
    console.log(`Drawing DAI: ${daiDifference.toString()}`);

    await cdp.drawDai(daiDifference);
  }

  console.log(`The current collateralization rate is ${(await cdp.getCollateralizationRatio()).toString()}`);
}

/**
 * Gets system's liquidation ratio and multiplies by SAVE_RATIO
 */
async function getSaveCollateralizationRatio(maker) {
  const ethCdp = maker.service("cdp");
  const ratio = await ethCdp.getLiquidationRatio();

  return ratio * SAVE_RATIO;
}
const SAVE_RATIO = 1.6;
