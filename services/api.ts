import contracts from "@/config/contracts.json";
import { CHAIN_NAME } from "@/config";

const queryNfts = `
query All($contract_address: String) {
	nfts(where: {
    contract_address: {
      _eq: $contract_address
    }
  }) {
    metadata
    token_id
    contract_address
    owner_address
    listings(where: {
      status: {
        _eq: "ongoing"
      }
    }) {
      status
      seller_address
      auction_config
      start_time
      end_time
      latest_price
    }
    
    offers {
    	offerer_address
      price
    }
  }
}
`;

const contractAddress = contracts[CHAIN_NAME].collection_contract;

export const fetchNfts = async () => {
  const response = await fetch("https://graphql.staging.seekhype.io/v1/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": "kKEeh13#EUhh"
    },
    body: JSON.stringify({
      query: queryNfts,
      variables: {
        contract_address: contractAddress
      }
    })
  });

  return response.json();
};