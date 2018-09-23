const { init, getSaveCollateralizationRatio } = require("./utils");

const Maker = require("@makerdao/dai");

async function openCDP() {
  const maker = await init();

  const cdp = await maker.openCdp();
  console.log("Created CDP with id: ", await cdp.getId());

  const ethToLock = 0.05;
  console.log(`Locking : ${ethToLock} ETH`);
  await cdp.lockEth(ethToLock);

  const daiCollateralValue = await cdp.getCollateralValue(Maker.USD);
  console.log("DAI collateral value: ", daiCollateralValue.toString());

  const saveCollateralizationRatio = await getSaveCollateralizationRatio(maker);
  const saveToPullDai = daiCollateralValue.div(saveCollateralizationRatio);

  console.log(`Drawing ${saveToPullDai}`);
  await cdp.drawDai(saveToPullDai);

  console.log(`Wiping ${saveToPullDai}`);
  await cdp.wipeDai(saveToPullDai, Maker.DAI);


  console.log(`The current collateralization rate is ${(await cdp.getCollateralizationRatio()).toString()}`);
}

openCDP()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
