// Pricing engine ported from the estimator app (src/pricing.js, src/rollerGrids.js,
// src/defaultConfig.js) so check-measure data can be run through the same calculation.
// Kept as a pure module (no network calls) — App.jsx fetches the live quote_config
// override from the shared Supabase project and merges it over DEFAULT_QUOTE_CONFIG.

export const ROLLER_WIDTHS = [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000];
export const ROLLER_DROPS = [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000];

export const ROLLER_GRIDS = {
  Budget: [
    [68,71,77,82,87,92,116,132,154,176,181],
    [70,75,81,86,92,97,124,140,161,182,198],
    [73,78,85,91,97,103,128,148,165,188,210],
    [75,82,88,95,101,108,135,154,173,196,218],
    [78,85,93,99,107,113,140,161,179,215,226],
    [81,88,95,105,112,119,144,167,193,224,233],
    [82,91,99,108,116,124,151,176,202,231,240],
    [94,105,113,123,132,141,170,180,213,237,250],
    [98,107,117,128,136,148,178,188,217,247,260],
    [101,114,123,132,142,153,184,195,227,255,275],
    [105,120,126,136,149,158,190,200,232,265,285],
  ],
  CatA: [
    [72,78,83,90,96,99,126,145,166,190,201],
    [76,82,89,95,102,105,133,154,178,202,213],
    [78,85,94,100,107,108,140,162,188,213,222],
    [82,90,99,107,116,119,148,172,198,225,240],
    [85,95,103,112,120,121,157,180,212,235,245],
    [90,99,107,118,123,133,166,189,219,244,256],
    [94,103,113,124,126,144,171,200,228,255,267],
    [106,116,129,140,147,163,194,207,238,269,285],
    [109,122,135,145,154,171,203,216,252,287,300],
    [113,126,138,152,162,179,213,227,262,295,315],
    [118,131,145,159,172,186,220,235,270,315,325],
  ],
  CatB: [
    [77,84,91,99,105,113,138,159,184,202,221],
    [81,92,98,106,113,120,147,171,193,222,223],
    [85,98,105,112,120,131,158,183,211,235,245],
    [91,102,109,120,129,139,167,193,221,253,266],
    [95,105,117,126,137,147,176,205,238,264,277],
    [99,111,122,134,145,157,185,216,249,276,288],
    [104,116,129,140,152,166,195,228,262,295,310],
    [117,131,145,161,175,188,222,240,275,315,330],
    [123,137,154,170,184,199,233,249,287,330,349],
    [127,145,161,176,192,207,243,261,310,349,370],
    [134,150,166,184,200,216,255,271,320,365,380],
  ],
  CatC: [
    [87,95,104,114,123,126,153,177,203,230,244],
    [92,101,113,124,134,137,165,186,219,244,259],
    [98,111,122,135,144,149,180,207,237,268,279],
    [104,117,130,143,154,161,192,220,251,276,309],
    [111,124,139,153,166,172,204,232,275,304,319],
    [113,132,146,163,177,184,216,248,290,320,334],
    [123,139,154,172,188,191,229,262,305,335,353],
    [140,161,173,197,217,227,264,276,318,351,371],
    [146,168,179,209,228,239,276,290,336,369,389],
    [153,175,197,218,239,252,290,306,349,385,410],
    [161,183,205,230,251,263,304,320,363,414,435],
  ],
  CatD: [
    [97,109,119,131,142,148,175,196,227,254,270],
    [105,117,130,143,157,161,192,215,247,277,292],
    [112,125,141,156,170,177,208,233,267,300,315],
    [119,135,152,168,183,192,224,253,290,322,340],
    [127,145,163,179,198,205,240,265,309,343,364],
    [139,154,174,192,211,219,255,288,329,366,383],
    [143,164,183,204,225,236,270,307,351,387,411],
    [157,187,204,226,250,262,301,325,370,411,433],
    [167,192,216,240,264,276,318,342,391,432,447],
    [174,200,226,252,278,291,335,360,411,454,481],
    [182,211,237,265,293,308,352,380,432,475,499],
  ],
  CatE: [
    [110,122,136,150,163,178,210,234,267,297,312],
    [117,134,150,164,181,195,220,258,292,324,341],
    [128,144,162,181,196,214,231,281,317,351,369],
    [137,157,174,194,213,233,270,305,342,378,398],
    [147,166,187,210,229,250,291,327,366,417,428],
    [155,179,195,224,246,269,311,350,391,431,457],
    [162,190,214,238,264,288,332,375,416,459,485],
    [180,212,217,267,305,321,368,396,443,485,513],
    [189,222,254,282,311,341,390,420,468,512,542],
    [203,234,267,297,328,360,412,444,492,540,572],
    [213,246,280,309,346,380,432,467,516,567,600],
  ],
  CatF: [
    [114,127,143,154,171,186,218,269,278,309,325],
    [124,139,157,172,190,206,241,284,305,338,356],
    [134,152,170,188,207,227,262,295,330,367,387],
    [144,163,185,205,226,245,285,321,359,396,417],
    [154,176,199,218,243,266,306,346,386,424,449],
    [163,188,212,238,261,286,328,370,411,455,480],
    [174,200,227,253,293,306,350,392,440,483,511],
    [192,222,253,281,311,341,389,420,467,512,542],
    [204,235,267,298,333,362,411,445,492,541,573],
    [215,247,281,315,349,382,435,470,519,569,605],
    [226,261,295,333,368,402,458,494,549,599,363],
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

export const DEFAULT_QUOTE_CONFIG = {
  fabrics: [
    { name: 'Standard', min: 0, max: 25 },
    { name: 'Plus', min: 25, max: 50 },
    { name: 'Premium', min: 50, max: 75 },
    { name: 'Luxury', min: 75, max: 200 },
  ],
  make: 45,
  lining: 20,
  hemReduction: 5,
  install: { sheer: 75, drape: 94, shutter: 109, roller: 37 },
  wavefold: { fixed: 284, perMm: 0.096667, min: 900 },
  wavefoldStandard: { fixed: 180, perMm: 0.06, min: 900 },
  pinch: { fixed: 84, perMm: 0.043333, min: 900 },
  pinchStandard: { fixed: 55, perMm: 0.025, min: 900 },
  rollerSqm: 0,
  shutterBass: 656,
  shutterPvc: 328,
  maxPanelWidth: 750,
  checkMeasure: 100,
  buffer: 15,
  fullness: 2.5,
  maxFabricWidth: 2700,
  motorisation: 200,
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
