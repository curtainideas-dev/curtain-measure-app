// Pricing engine ported from the estimator app (src/pricing.js, src/rollerGrids.js,
// src/defaultConfig.js) so check-measure data can be run through the same calculation.
// Kept as a pure module (no network calls) — App.jsx fetches the live quote_config
// override from the shared Supabase project and merges it over DEFAULT_QUOTE_CONFIG.

export const ROLLER_WIDTHS = [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000];
export const ROLLER_DROPS = [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000];

export const ROLLER_GRIDS = {
  CatA: [
    [127,137,146,158,169,174,222,255,292,334,354],
    [134,144,157,167,180,185,234,271,313,356,375],
    [137,150,165,176,188,190,246,285,331,375,391],
    [144,158,174,188,204,209,260,303,348,396,422],
    [150,167,181,197,211,213,276,317,373,414,431],
    [158,174,188,208,216,234,292,333,385,429,451],
    [165,181,199,218,222,253,301,352,401,449,470],
    [187,204,227,246,259,287,341,364,419,473,502],
    [192,215,238,255,271,301,357,380,444,505,528],
    [199,222,243,268,285,315,375,400,461,519,554],
    [208,231,255,280,303,327,387,414,475,554,572],
  ],
  CatB: [
    [136,148,160,174,185,199,243,280,324,356,389],
    [143,162,172,187,199,211,259,301,340,391,392],
    [150,172,185,197,211,231,278,322,371,414,431],
    [160,180,192,211,227,245,294,340,389,445,468],
    [167,185,206,222,241,259,310,361,419,465,488],
    [174,195,215,236,255,276,326,380,438,486,507],
    [183,204,227,246,268,292,343,401,461,519,546],
    [206,231,255,283,308,331,391,422,484,554,581],
    [216,241,271,299,324,350,410,438,505,581,614],
    [224,255,283,310,338,364,428,459,546,614,651],
    [236,264,292,324,352,380,449,477,563,642,669],
  ],
  CatC: [
    [153,167,183,201,216,222,269,312,357,405,429],
    [162,178,199,218,236,241,290,327,385,429,456],
    [172,195,215,238,253,262,317,364,417,472,491],
    [183,206,229,252,271,283,338,387,442,486,544],
    [195,218,245,269,292,303,359,408,484,535,561],
    [199,232,257,287,312,324,380,436,510,563,588],
    [216,245,271,303,331,336,403,461,537,590,621],
    [246,283,304,347,382,400,465,486,560,618,653],
    [257,296,315,368,401,421,486,510,591,649,685],
    [269,308,347,384,421,444,510,539,614,678,722],
    [283,322,361,405,442,463,535,563,639,729,766],
  ],
  CatD: [
    [171,192,209,231,250,260,308,345,400,447,475],
    [185,206,229,252,276,283,338,378,435,488,514],
    [197,220,248,275,299,312,366,410,470,528,554],
    [209,238,268,296,322,338,394,445,510,567,598],
    [224,255,287,315,348,361,422,466,544,604,641],
    [245,271,306,338,371,385,449,507,579,644,674],
    [252,289,322,359,396,415,475,540,618,681,723],
    [276,329,359,398,440,461,530,572,651,723,762],
    [294,338,380,422,465,486,560,602,688,760,787],
    [306,352,398,444,489,512,590,634,723,799,847],
    [320,371,417,466,516,542,620,669,760,836,878],
  ],
  CatE: [
    [194,215,239,264,287,313,370,412,470,523,549],
    [206,236,264,289,319,343,387,454,514,570,600],
    [225,253,285,319,345,377,407,495,558,618,649],
    [241,276,306,341,375,410,475,537,602,665,700],
    [259,292,329,370,403,440,512,576,644,734,753],
    [273,315,343,394,433,473,547,616,688,759,804],
    [285,334,377,419,465,507,584,660,732,808,854],
    [317,373,382,470,537,565,648,697,780,854,903],
    [333,391,447,496,547,600,686,739,824,901,954],
    [357,412,470,523,577,634,725,781,866,950,1007],
    [375,433,493,544,609,669,760,822,908,998,1056],
  ],
  CatF: [
    [201,224,252,271,301,327,384,473,489,544,572],
    [218,245,276,303,334,363,424,500,537,595,627],
    [236,268,299,331,364,400,461,519,581,646,681],
    [253,287,326,361,398,431,502,565,632,697,734],
    [271,310,350,384,428,468,539,609,679,746,790],
    [287,331,373,419,459,503,577,651,723,801,845],
    [306,352,400,445,516,539,616,690,774,850,899],
    [338,391,445,495,547,600,685,739,822,901,954],
    [359,414,470,524,586,637,723,783,866,952,1008],
    [378,435,495,554,614,672,766,827,913,1001,1065],
    [398,459,519,586,648,708,806,869,966,1054,1167],
  ],
  Budget: [
    [120,125,136,144,153,162,204,232,271,310,319],
    [123,132,143,151,162,171,218,246,283,320,348],
    [128,137,150,160,171,181,225,260,290,331,370],
    [132,144,155,167,178,190,238,271,304,345,384],
    [137,150,164,174,188,199,246,283,315,378,398],
    [143,155,167,185,197,209,253,294,340,394,410],
    [144,160,174,190,204,218,266,310,356,407,422],
    [165,185,199,216,232,248,299,317,375,417,440],
    [172,188,206,225,239,260,313,331,382,435,458],
    [178,201,216,232,250,269,324,343,400,449,484],
    [185,211,222,239,262,278,334,352,408,466,502],
  ],
};

export const ROLLER_CATEGORIES = Object.keys(ROLLER_GRIDS);

// Bilinear interpolation lookup
export function lookupRollerPrice(category, widthMm, dropMm, gridsOverride) {
  const grids = gridsOverride || ROLLER_GRIDS;
  const grid = grids[category];
  if (!grid) return null;

  const w = widthMm;
  const d = dropMm;

  const wClamped = Math.min(Math.max(w, ROLLER_WIDTHS[0]), ROLLER_WIDTHS[ROLLER_WIDTHS.length - 1]);
  const dClamped = Math.min(Math.max(d, ROLLER_DROPS[0]), ROLLER_DROPS[ROLLER_DROPS.length - 1]);

  let wi = ROLLER_WIDTHS.findIndex((v) => v >= wClamped);
  let di = ROLLER_DROPS.findIndex((v) => v >= dClamped);

  if (wi === 0) wi = 1;
  if (di === 0) di = 1;

  const w0 = ROLLER_WIDTHS[wi - 1], w1 = ROLLER_WIDTHS[wi];
  const d0 = ROLLER_DROPS[di - 1], d1 = ROLLER_DROPS[di];

  const wt = (wClamped - w0) / (w1 - w0);
  const dt = (dClamped - d0) / (d1 - d0);

  const v00 = grid[di - 1][wi - 1];
  const v10 = grid[di - 1][wi];
  const v01 = grid[di][wi - 1];
  const v11 = grid[di][wi];

  const price = v00 * (1 - wt) * (1 - dt)
             + v10 * wt * (1 - dt)
             + v01 * (1 - wt) * dt
             + v11 * wt * dt;

  return Math.round(price);
}

// Fallback only: mirrors the live quote_config as of 2026-11-05. The app prefers the
// live config, then the last copy cached on the device, and only uses these when
// neither is available (e.g. first launch with no signal). Keep in sync with the
// estimator's Admin settings when prices change.
export const DEFAULT_QUOTE_CONFIG = {
  fabrics: [
    { name: 'Standard', min: 0, max: 25 },
    { name: 'Plus', min: 25, max: 50 },
    { name: 'Premium', min: 50, max: 75 },
    { name: 'Luxury', min: 75, max: 200 },
  ],
  make: 45,
  lining: 50,
  hemReduction: 10,
  install: { sheer: 75, drape: 94, shutter: 109, roller: 37 },
  wavefold: { fixed: 925.05, perMm: 0.1587, min: 900 },
  wavefoldStandard: { fixed: 138.7, perMm: 0.019647, min: 900 },
  pinch: { fixed: 925.05, perMm: 0.1587, min: 900 },
  pinchStandard: { fixed: 84, perMm: 0.043333, min: 900 },
  rollerSqm: 0,
  shutterBass: 656,
  shutterPvc: 328,
  maxPanelWidth: 750,
  checkMeasure: 200,
  buffer: 10,
  fullness: 2.5,
  maxFabricWidth: 2700,
  motorisation: 450,
  rollerGrids: null, // falls back to ROLLER_GRIDS in lookupRollerPrice
};

export function calcLine(line, config) {
  const { type, heading, fabric, lining, material, width, drop } = line;
  if (!type || !width || !drop) return null;
  const w = parseFloat(width);
  const d = parseFloat(drop);
  if (!w || !d) return null;

  const buf = config.buffer / 100;

  if (type === 'Sheer' || type === 'Drape') {
    if (!heading || !fabric) return null;
    const fab = config.fabrics.find((f) => f.name === fabric);
    if (!fab) return null;
    const wM = w / 1000;
    const dM = d / 1000;
    const fullness = config.fullness || 2.5;
    const maxFabW = (config.maxFabricWidth || 2700) / 1000;
    let usage;
    if (dM <= maxFabW) {
      usage = fullness * wM;
    } else {
      const drops = Math.ceil(wM / maxFabW);
      usage = fullness * drops * dM;
    }
    const fabMid = (fab.min + fab.max) / 2;
    const fabCost = usage * fabMid;
    const makeCost = usage * config.make;
    const hemSaving = line.noHem ? usage * (config.hemReduction || 0) : 0;
    const liningCost = lining ? usage * config.lining : 0;
    const trackGrade = line.trackGrade || 'Premium';
    const trackCfg = heading === 'Wavefold'
      ? (trackGrade === 'Standard' ? config.wavefoldStandard : config.wavefold)
      : (trackGrade === 'Standard' ? config.pinchStandard : config.pinch);
    const trackW = Math.max(w, trackCfg.min);
    const trackCost = trackCfg.fixed + (trackW > trackCfg.min ? (trackW - trackCfg.min) * trackCfg.perMm : 0);
    const installCost = type === 'Sheer' ? config.install.sheer : config.install.drape;
    const base = fabCost + makeCost - hemSaving + liningCost + trackCost + installCost;
    return {
      low: base * (1 - buf / 2),
      high: base * (1 + buf / 2),
      install: installCost * (1 - buf / 2),
      installHigh: installCost * (1 + buf / 2),
      desc: `${heading} · ${fabric}${lining ? ' + lining' : ''} · ${wM.toFixed(2)}m × ${dM.toFixed(2)}m`,
    };
  }

  if (type === 'Roller blind') {
    if (!line.rollerCategory) return null;
    const blindPrice = lookupRollerPrice(line.rollerCategory, w, d, config.rollerGrids);
    if (blindPrice === null) return null;
    const motorCost = line.motorised ? (config.motorisation || 200) : 0;
    const installCost = config.install.roller;
    const base = blindPrice + installCost + motorCost;
    return {
      low: base * (1 - buf / 2),
      high: base * (1 + buf / 2),
      install: installCost * (1 - buf / 2),
      installHigh: installCost * (1 + buf / 2),
      desc: `Roller blind · ${line.rollerCategory}${line.motorised ? ' · motorised' : ''} · ${(w / 1000).toFixed(2)}m × ${(d / 1000).toFixed(2)}m`,
    };
  }

  if (type === 'Shutter') {
    if (!material) return null;
    const sqm = (w / 1000) * (d / 1000);
    const rate = material === 'Basswood' ? config.shutterBass : config.shutterPvc;
    const panelCount = Math.ceil(w / (config.maxPanelWidth || 750));
    const shutterCost = sqm * rate;
    const installCost = panelCount * config.install.shutter;
    const checkMeasure = config.checkMeasure || 0;
    const base = shutterCost + installCost + checkMeasure;
    return {
      low: base * (1 - buf / 2),
      high: base * (1 + buf / 2),
      install: installCost * (1 - buf / 2),
      installHigh: installCost * (1 + buf / 2),
      desc: `${material} shutter · ${sqm.toFixed(2)}m² · ${panelCount} panel${panelCount > 1 ? 's' : ''}`,
    };
  }

  return null;
}

export function fmt(n) {
  return (Math.ceil(n / 100) * 100).toLocaleString('en-AU');
}
