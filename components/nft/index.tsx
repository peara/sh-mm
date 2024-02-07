import { useChain } from "@cosmos-kit/react";
import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import dayjs from "dayjs";

import { CHAIN_NAME } from "@/config";
import contracts from "@/config/contracts.json";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { useToast } from "../ui/use-toast";

console.log('CHAIN_NAME', CHAIN_NAME);

enum NftType {
  RED = "RED",
  BLUE = "BLUE",
  WHITE = "WHITE",
  GOLD = "GOLD",
}

const nftTypeColors = {
  [NftType.RED]: "bg-red-100",
  [NftType.BLUE]: "bg-blue-100",
  [NftType.WHITE]: "bg-white-100",
  [NftType.GOLD]: "bg-yellow-100",
};

const convertDate = (date: dayjs.Dayjs): string => {
  const timestamp = date.valueOf() * 1000000; // Convert to nanoseconds
  return timestamp.toString();
}

export const NftTable = ({ nfts }: any) => {
  const [sweepConfig, setSweepConfig] = useState<any>({ price: 1000000, quantity: 10, type: "" });
  const [offerConfig, setOfferConfig] = useState<any>({ price: 1000000, end_time: dayjs().add(1, 'day') });
  const [selectedNfts, setSelectedNfts] = useState<any>([]);
  const { toast } = useToast();

  const normalizedData = useMemo(() => nfts.map((nft: any) => {
    return {
      contract_address: nft.contract_address,
      token_id: nft.token_id,
      image: nft.metadata.s3_image,
      name: nft.metadata.name,
      type: nft.metadata.attributes[0].value as NftType,
      owner_address: nft.owner_address,
      price: nft.listings[0]?.latest_price,
    }
  }), [nfts]);
  console.log(normalizedData)

  const [data, setData] = useState<any>([]);
  useEffect(() => {
    setData(nfts.map((nft: any) => {
      return {
        contract_address: nft.contract_address,
        token_id: nft.token_id,
        image: nft.metadata.s3_image,
        name: nft.metadata.name,
        type: nft.metadata.attributes[0].value as NftType,
        owner_address: nft.owner_address,
        price: nft.listings[0]?.latest_price,
      }
    }))
  }, [nfts])
  console.log('D', data)

  const { address, getSigningCosmWasmClient } = useChain('euphoria-2');

  const handleCheck = (id: string, e: any) => {
    console.log(id, e);
    if (id === 'all') {
      if (e) {
        const tokenIds = normalizedData.map((nft: any) => nft.token_id);
        const checkboxes = tokenIds.map((id: string) => document.querySelector(`#${'token-' + id}[role='checkbox']`));
        if (checkboxes.length > 10) {
          toast({
            title: "Too many NFTs",
            description: "You can only select up to 10 NFTs at a time",
          })
          // untick the all checkbox
          const allCheckbox = document.querySelector(`#all[role='checkbox']`) as any;
          if (allCheckbox) {
            // it should be fine as it will uncheck then return immediately
            allCheckbox.click();
          }
        }
        checkboxes.forEach((checkbox: any) => {
          if (checkbox && checkbox['data-state'] === 'unchecked') {
            checkbox.click();
          }
        });
      } else {
        setSelectedNfts([]);
      }
    } else {
      if (e) {
        setSelectedNfts([...new Set([...selectedNfts, id])]);
      } else {
        setSelectedNfts(selectedNfts.filter((nftId: string) => nftId !== id));
      }
    }
  }

  const handleBuy = async (nfts: any) => {
    if (!address) return;
    const client = await getSigningCosmWasmClient();

    // generate buy messages

    const msgs = nfts.map((nft: any) => {
      return {
        contractAddress: contracts[CHAIN_NAME].marketplace_contract,
        msg: {
          buy: {
            contract_address: contracts[CHAIN_NAME].collection_contract,
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

    // console.log(msgs)
    if (msgs.length === 0) return;

    await client.executeMultiple(address, msgs, "auto");
  }

  const sortByPrice = () => {
    normalizedData.sort((a: any, b: any) => {
      if (a.price && b.price) {
        return a.price - b.price;
      }
      return 0;
    });
  }

  const handleOffer = async () => {
    console.log('Offering', selectedNfts);
    if (!address) return;

    const tokenIds = selectedNfts.map((id: string) => id.split('-')[1]);
    const client = await getSigningCosmWasmClient();

    const msgs = tokenIds.map((tokenId: any) => {
      return {
        contractAddress: contracts[CHAIN_NAME].marketplace_contract,
        msg: {
          offer_nft: {
            funds_amount: offerConfig.price.toString(),
            end_time: {
              at_time: convertDate(offerConfig.end_time)
            },
            nft: {
              contract_address: contracts[CHAIN_NAME].collection_contract,
              token_id: tokenId
            },
          }
        },
        funds: []
      }
    });

    // console.log(msgs)
    if (msgs.length === 0) return;

    await client.executeMultiple(address, msgs, "auto");
  };

  const handleSweep = async () => {
    console.log(selectedNfts);
    if (!address) return;

    // filter listings below a price and quantity
    const sweepNfts = normalizedData.filter((nft: any) => {
      return nft.price && (nft.price <= sweepConfig.price) && (sweepConfig.type === "" || nft.type === sweepConfig.type);
    }).slice(0, sweepConfig.quantity);

    await handleBuy(sweepNfts);
  };

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Sweep Floor</Button>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select onValueChange={(e: any) => {
                console.log(e);
                setSweepConfig({ ...sweepConfig, type: e })
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue>{sweepConfig.type || "any"}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-gray-100">
                  <SelectGroup>
                    {Object.values(NftType).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" variant="outline" className="bg-orange-300" onClick={handleSweep}>Sweep</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Offer selected</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Sweep listings below a price</DialogTitle>
          </DialogHeader>
          {address || <div className="text-center text-red-400 py-4">Please connect your wallet to make an offer</div>}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input id="price" value={offerConfig.price}
                onChange={(e) => {
                  setOfferConfig({ ...offerConfig, price: e.currentTarget.value ? Number.parseInt(e.currentTarget.value, 10) : 0 })
                }}
                className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end_time" className="text-right">
                End time
              </Label>
              <Input id="end_time" value={offerConfig.end_time.format('YYYY-MM-DD')}
                onChange={(e) => {
                  console.log(e.currentTarget.value, dayjs(e.currentTarget.value).format('MM/DD/YYYY'));
                  setOfferConfig({ ...offerConfig, end_time: dayjs(e.currentTarget.value) })
                }}
                type="date"
                className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!address} variant="outline" className="bg-orange-300" onClick={handleOffer}>Offer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Table aria-label="nft table">
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead>Token ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>
              <Select
                onValueChange={(e) => {
                  setData(normalizedData.filter((nft: any) => e === "" || nft.type === e))
                }}
              >
                <SelectTrigger>
                  <SelectValue>Type</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-gray-100">
                  <SelectGroup>
                    {Object.values(NftType).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead>Owned</TableHead>
            <TableHead>
              <Button variant="outline" onClick={() => sortByPrice()}>Price</Button>
            </TableHead>
            <TableHead>
              <Checkbox id="all" onCheckedChange={handleCheck.bind(null, 'all')} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((nft: any) => (
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
              <TableCell className={nft.type ? nftTypeColors[nft.type as NftType] : ''}>{nft.type}</TableCell>
              <TableCell>{nft.owner_address === address ? "own" : ""}</TableCell>
              <TableCell>{nft.price}</TableCell>
              <TableCell>
                <Checkbox checked={selectedNfts.includes('token-' + nft.token_id)} id={'token-' + nft.token_id} onCheckedChange={handleCheck.bind(null, 'token-' + nft.token_id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table >
    </div>
  )
};