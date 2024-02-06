import { Divider } from "@interchain-ui/react";
import { Wallet } from "@/components/wallet";
import { Layout } from "@/components/common/Layout";
import { useEffect, useState } from "react";
import { fetchNfts } from "@/services/api";
import { NftTable } from "@/components/nft";

export default function Home() {
  const [nfts, setNfts] = useState<any[]>([]);

  useEffect(() => {
    (
      async () => {
        const data = await fetchNfts();
        console.log(data);
        setNfts(data.data.nfts);
      }
    )();
  }, []);

  console.log('NFT', nfts);

  return (
    <Layout>
      <Wallet />
      {/* <Divider mb="$16" /> */}

      <NftTable nfts={nfts} />
    </Layout>
  );
}
