import { runBars } from "./vendor/makefun-bars.ts";

const SYMBOL = "CBBTC";
const EMA_PERIOD = 120;
const EMA_ALPHA = 2 / (EMA_PERIOD + 1);
const MAX_HOLD_BARS = 240;
const MIN_BUY_QUOTE_UNITS = 1_000_000n;
const MAX_SLIPPAGE_BPS = 100;

let barsSeen = 0;
let nonWarmupBatches = 0;
let hasDecidedBuy = false;
let ema: number | null = null;
let entryClose: bigint | null = null;
let entryBar = 0;

await runBars({
  onBatch(state, batch) {
    if (!state.warmingUp) nonWarmupBatches += 1;

    // Only an actual CBBTC bar advances its indicators and holding period.
    if (!batch.bars.some((bar) => bar.symbol === SYMBOL)) return;

    const close = state.close(SYMBOL);
    if (close === null) return;

    barsSeen += 1;
    // Numbers are used only for the indicator; prices used by the stop and
    // every amount submitted in an order remain exact big integers.
    const indicatorClose = Number(close);
    ema = ema === null
      ? indicatorClose
      : ema + EMA_ALPHA * (indicatorClose - ema);

    if (state.warmingUp || barsSeen <= EMA_PERIOD) return;

    const position = state.positions.get(SYMBOL);
    const quantity = position?.qty ?? 0n;

    if (quantity > 0n) {
      const takeProfit = indicatorClose >= ema * 1.005;
      const stopLoss = entryClose !== null
        && close * 10_000n <= entryClose * 9_850n;
      const timeExit = entryClose !== null
        && barsSeen - entryBar >= MAX_HOLD_BARS;

      if (takeProfit || stopLoss || timeExit) {
        return [{
          side: "sell",
          symbol: SYMBOL,
          qty: quantity,
          max_slippage_bps: MAX_SLIPPAGE_BPS,
        }];
      }
      return;
    }

    const insuranceEntry = nonWarmupBatches >= 900 && !hasDecidedBuy;
    if (indicatorClose <= ema * 0.993 || insuranceEntry) {
      const notional = state.cash / 2n;
      if (notional < MIN_BUY_QUOTE_UNITS) return;

      // Anchor exits to the decision bar, rather than the next bar's fill.
      entryClose = close;
      entryBar = barsSeen;
      hasDecidedBuy = true;
      return [{
        side: "buy",
        symbol: SYMBOL,
        notional_quote_units: notional,
        max_slippage_bps: MAX_SLIPPAGE_BPS,
      }];
    }
  },
});
