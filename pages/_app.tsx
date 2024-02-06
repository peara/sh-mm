import "../styles/globals.css";
import "@interchain-ui/react/styles";

import type { AppProps } from "next/app";
import { SignerOptions, wallets } from "cosmos-kit";
import { ChainProvider } from "@cosmos-kit/react";
import { assets, chains } from "chain-registry";
import {
  Box,
} from "@interchain-ui/react";
import { GasPrice } from "@cosmjs/stargate";
import { Chain, AssetList } from '@chain-registry/types';

import Euphoria from '@/config/chain/euphoria/chain_config.json';
import AssetEuphoria from '@/config/chain/euphoria/asset.json';

const mainnet = chains.filter((chain) => chain.chain_name === "aura")[0];
const AssetsMainnet = assets.find((asset) => asset.chain_name === 'aura');

function CreateCosmosApp({ Component, pageProps }: AppProps) {
  const signerOptions: SignerOptions = {
    signingCosmwasm: () => {
      return {
        gasPrice: GasPrice.fromString('0.0025ueaura'),
      } as any;
    },
    preferredSignType: () => {
      return "amino";
    },
  };

  return (
    <ChainProvider
      chains={[mainnet, Euphoria]}
      assetLists={[
        AssetsMainnet,
        AssetEuphoria,
      ] as AssetList[]}
      wallets={wallets}
      walletConnectOptions={{
        signClient: {
          projectId: "a8510432ebb71e6948cfd6cde54b70f7",
          relayUrl: "wss://relay.walletconnect.org",
          metadata: {
            name: "CosmosKit Template",
            description: "CosmosKit dapp template",
            url: "https://docs.cosmology.zone/cosmos-kit/",
            icons: [],
          },
        },
      }}
      // @ts-ignore
      signerOptions={signerOptions}
    >
      <Box
        minHeight="100dvh"
        backgroundColor="white"
      >
        <Component {...pageProps} />
      </Box>
    </ChainProvider>
  );
}

export default CreateCosmosApp;
