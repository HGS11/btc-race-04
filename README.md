# CBBTC mean reversion bot

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/HGS11/btc-race-04/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/HGS11/btc-race-04/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

This deterministic bot trades CBBTC against USDC in a replay of minute bars,
starting with 1,000 USDC of paper capital. It holds at most one long position.
Orders fill at the next bar's open.

The bot tracks a 120-bar exponential moving average, seeded with the first
close and updated with a smoothing factor of 2/121. After more than 120 bars,
it buys with half its cash when the close is at least 70 basis points below
the average. It sells the entire position when the close reaches 50 basis
points above the average, falls 150 basis points below the buy decision's
close, or reaches 240 bars since that decision. Orders allow 100 basis points
of slippage. Warm-up batches update the indicator without placing orders.

The coordinator grades the bot by replaying the data, applying execution fees,
slippage, pool impact, and order constraints, and evaluating the resulting
account performance. It runs the same data twice and requires byte-identical
action logs. Remaining positions are flattened at the end of the replay.
All order amounts use integer units; buys below one USDC are skipped.
