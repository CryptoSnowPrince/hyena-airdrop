const clusterApiUrl = 'devnet';

const tokenPublicKey = "address";

// List of recipient addresses and the amount of tokens to airdrop
const recipients = [
    { address: "address", amount: 10_000 },
    { address: "address", amount: 10_000 },
    // Add more recipients as needed
];

module.exports = {
    clusterApiUrl,
    tokenPublicKey,
    recipients
};