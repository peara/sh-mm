import { useChain } from "@cosmos-kit/react";
import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const NftTable = ({ nfts }: any) => {
  const [sweepConfig, setSweepConfig] = useState<any>({ price: 1000000, quantity: 10 });
  const normalizedData = useMemo(() => {
    return nfts.map((nft: any) => {
      return {
        contract_address: nft.contract_address,
        token_id: nft.token_id,
        image: nft.metadata.s3_image,
        name: nft.metadata.name,
        owner_address: nft.owner_address,
        price: nft.listings[0]?.latest_price,
      }
    })
  }, [nfts])

  const { address, getSigningCosmWasmClient } = useChain('euphoria-2');

  const handleSweep = async () => {
    if (!address) return;

    // filter listings below a price and quantity
    const selectedNfts = normalizedData.filter((nft: any) => {
      return nft.price <= sweepConfig.price
    }).slice(0, sweepConfig.quantity);
    console.log(selectedNfts);

    const client = await getSigningCosmWasmClient();

    // generate buy messages
    const msgs = selectedNfts.map((nft: any) => {
      return {
        contractAddress: "aura1fd4zehc2alny703w3z2sqgqnyjlxdk8uyvtlecz6e7hvl3g74aas9r4ydu",
        msg: {
          buy: {
            contract_address: nft.contract_address,
            token_id: nft.token_id
          }
        },
        funds: [
          {
            denom: "ueaura",
            amount: nft.price.toString(),
          }
        ]
      }
    });

    console.log(msgs)
    if (msgs.length === 0) return;

    await client.executeMultiple(address, msgs, "auto");
  };

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Sweep</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Sweep listings below a price</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input id="price" value={sweepConfig.price}
                onChange={(e) => {
                  setSweepConfig({ ...sweepConfig, price: e.currentTarget.value ? Number.parseInt(e.currentTarget.value, 10) : 0 })
                }}
                className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input id="quantity" value={sweepConfig.quantity}
                onChange={(e) => {
                  setSweepConfig({ ...sweepConfig, quantity: e.currentTarget.value ? Number.parseInt(e.currentTarget.value, 10) : 0 })
                }}
                className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" variant="outline" className="bg-orange-300" onClick={handleSweep}>Sweep</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Table aria-label="nft table">
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead>Token ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Owned</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {normalizedData.map((nft: any) => (
            <TableRow key={nft.token_id}>
              <TableCell>
                <img
                  src={nft.image}
                  alt={nft.name}
                  style={{ width: '50px', height: '50px' }}
                />
              </TableCell>
              <TableCell>
                <span>
                  {nft.token_id}
                </span>
              </TableCell>
              <TableCell>{nft.name}</TableCell>
              <TableCell>{nft.owner_address === address ? "own" : ""}</TableCell>
              <TableCell>{nft.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table >
    </div>
  )
};