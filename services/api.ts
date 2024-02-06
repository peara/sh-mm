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

const contractAddress = "aura1cnwzxt48n3hfeqxzsrzpnxtmn6248gp2j9rgnv7u787mdj7psf8s6mt2df";

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