import BigNumber from "bignumber.js";

import {
  AccountToken,
  TokenStandard,
  TokenStatus,
  TokenType,
} from "core/types";
import { createAccountTokenKey, parseTokenSlug } from "core/common/tokens";
import * as repo from "core/repo";

import { syncStarted, synced } from "../../state";
import { getDebankChain, debankApi } from "../debank";
import { getCoinGeckoPrices } from "../coinGecko";
import { getBalanceFromChain, getTokenMetadata } from "../chain";
import { enqueueTokensSync } from "./queue";

const stack = new Set<string>();

export async function addFindTokenRequest(
  chainId: number,
  accountAddress: string,
  tokenSlug: string
) {
  const dbKey = createAccountTokenKey({
    chainId,
    accountAddress,
    tokenSlug,
  });

  if (stack.has(dbKey)) return;

  stack.add(dbKey);
  syncStarted(chainId);

  try {
    await enqueueTokensSync(async () => {
      let tokenToAdd: AccountToken | undefined;

      const { standard, address: tokenAddress } = parseTokenSlug(tokenSlug);

      const existing = await repo.accountTokens.get(dbKey);
      if (existing) {
        const balance = await getBalanceFromChain(
          chainId,
          tokenSlug,
          accountAddress
        );

        const rawBalance = balance?.toString() ?? "0";
        const balanceUSD =
          existing.tokenType === TokenType.Asset &&
          "priceUSD" in existing &&
          existing.priceUSD
            ? new BigNumber(rawBalance)
                .div(10 ** existing.decimals)
                .times(existing.priceUSD)
                .toNumber()
            : existing.balanceUSD ?? 0;

        await repo.accountTokens.put(
          {
            ...existing,
            rawBalance,
            balanceUSD,
          },
          dbKey
        );

        return;
      }

      if (standard === TokenStandard.Native) return;

      let priceUSD, priceUSDChange: string | undefined;

      if (standard === TokenStandard.ERC20) {
        const [debankChain, coinGeckoPrices] = await Promise.all([
          getDebankChain(chainId),
          getCoinGeckoPrices(chainId, [tokenAddress]),
        ]);

        const cgTokenAddress = tokenAddress.toLowerCase();
        const cgPrice = coinGeckoPrices[cgTokenAddress];

        priceUSD = cgPrice?.usd?.toString();
        priceUSDChange = cgPrice?.usd_24h_change?.toString();

        if (debankChain) {
          const [{ data: dbToken }, balance] = await Promise.all([
            debankApi
              .get("/token", {
                params: {
                  chain_id: debankChain.id,
                  id: tokenAddress,
                },
              })
              .catch(() => ({ data: null })),
            getBalanceFromChain(chainId, tokenSlug, accountAddress),
          ]);

          if (dbToken) {
            if (!priceUSD && dbToken.price) {
              priceUSD = new BigNumber(dbToken.price).toString();
            }

            const rawBalance = balance?.toString() ?? "0";
            const balanceUSD = priceUSD
              ? new BigNumber(rawBalance)
                  .div(10 ** dbToken.decimals)
                  .times(priceUSD)
                  .toNumber()
              : 0;

            tokenToAdd = {
              tokenType: TokenType.Asset,
              status: TokenStatus.Enabled,
              chainId,
              accountAddress,
              tokenSlug,
              // Metadata
              decimals: dbToken.decimals,
              name: dbToken.name,
              symbol: dbToken.symbol,
              logoUrl: dbToken.logo_url,
              // Volumes
              rawBalance,
              balanceUSD,
              priceUSD,
              priceUSDChange,
            };
          }
        }
      }

      if (!tokenToAdd) {
        const [metadata, balance] = await Promise.all([
          getTokenMetadata(chainId, tokenSlug),
          getBalanceFromChain(chainId, tokenSlug, accountAddress),
        ]);
        if (!metadata) return;

        const rawBalance = balance?.toString() ?? "0";
        const balanceUSD =
          priceUSD && "decimals" in metadata
            ? new BigNumber(rawBalance)
                .div(10 ** metadata.decimals)
                .times(priceUSD)
                .toNumber()
            : 0;

        tokenToAdd = {
          tokenType:
            standard === TokenStandard.ERC20 ? TokenType.Asset : TokenType.NFT,
          status: TokenStatus.Enabled,
          chainId,
          accountAddress,
          tokenSlug,
          // Metadata
          ...(metadata as any),
          // Volumes
          rawBalance,
          balanceUSD,
          priceUSD,
          priceUSDChange,
        };
      }

      if (tokenToAdd) {
        await repo.accountTokens.put(tokenToAdd, dbKey);
      }
    });
  } catch (err) {
    console.error(err);
  }

  stack.delete(dbKey);
  setTimeout(() => synced(chainId), 500);
}
