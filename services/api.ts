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

const contractAddress = "aura14rrxnmkpnvcmeknjzma0myeepdxaa86wh5837959ek37dmrl2lxqfg66z0";

export const fetchNfts = async () => {
  const response = await fetch("https://graphql.staging.seekhype.io/v1/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": "staging@123"
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