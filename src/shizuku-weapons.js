// IDs remain stable so existing draws and equipped scythes survive visual upgrades.
export const SHIZUKU_SCYTHE_NAMES=Object.freeze({
 'crimson-scythe':Object.freeze(['','紅月の鎌・しずく','紅月の鎌・くれない','紅月の鎌・黒薔薇','紅月の大鎌・雫の誓い']),
 'twilight-scythe':Object.freeze(['','','宵風の鎌・ねむり','宵風の鎌・夜渡り','宵月の翼鎌・夢結び']),
 'garnet-scythe':Object.freeze(['','','魔心の鎌・かえり道','魔心の鎌・紅晶','魔王の護鎌・おかえり']),
});
export const shizukuScytheName=(family,rank)=>SHIZUKU_SCYTHE_NAMES[family]?.[rank]||'紅月の鎌・しずく';
