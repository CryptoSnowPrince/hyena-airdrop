const solanaWeb3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const { programs } = require('@metaplex-foundation/js');
const viem = require('viem');
const key_json = require('./id.json');
const config = require('./config');

// Define the network (devnet or mainnet)
const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl(config.clusterApiUrl));

// Your wallet's private key (Use a secure way to handle this in production)
const secretKey = Uint8Array.from(key_json);
const fromWallet = solanaWeb3.Keypair.fromSecretKey(secretKey);

// Token mint address of the SPL token
const tokenMintAddress = new solanaWeb3.PublicKey(config.tokenPublicKey);

const recipients = config.recipients;

// Airdrop function
async function airdrop() {
    try {
        const balance = await connection.getBalance(fromWallet.publicKey)
        // Convert lamports to SOL
        const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;

        console.log(`FromWallet: ${fromWallet.publicKey.toString()}`)
        console.log(`SOL Balance: ${solBalance} SOL`);
        // Fetch or create the associated token account for the sender
        const fromTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            tokenMintAddress,
            fromWallet.publicKey
        );

        const mintInfo = await splToken.getMint(connection, tokenMintAddress);

        // Get and log the balance of the fromTokenAccount
        const fromTokenAccountInfo = await splToken.getAccount(connection, fromTokenAccount.address);

        let tokenName = 'token'
        let tokenSymbol = 'token'
        try {
            // Retrieve the metadata address (PDA)
            const metadataPDA = await programs.metadata.Metadata.getPDA(tokenMintAddress);

            // Fetch the metadata
            const metadata = await programs.metadata.Metadata.load(connection, metadataPDA);

            // Extract the name and symbol
            const { data: { data: { name, symbol } } } = metadata;

            console.log(`Token Name: ${name}`);
            console.log(`Token Symbol: ${symbol}`);
            tokenName = name
            tokenSymbol = symbol
        } catch (error) { }

        console.log(`Token Balance: ${viem.formatUnits(fromTokenAccountInfo.amount, mintInfo.decimals)} ${tokenName}`);

        let i = 0;
        for (let recipient of recipients) {
            const recipientPublicKey = new solanaWeb3.PublicKey(recipient.address);

            // Fetch or create the associated token account for the recipient
            const recipientTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
                connection,
                fromWallet,
                tokenMintAddress,
                recipientPublicKey
            );

            // Create the transaction to transfer tokens
            const transaction = new solanaWeb3.Transaction().add(
                splToken.createTransferInstruction(
                    fromTokenAccount.address,   // source
                    recipientTokenAccount.address, // destination
                    fromWallet.publicKey,       // authority
                    viem.parseUnits(recipient.amount.toString(), mintInfo.decimals),           // amount
                    [],                         // multisig signer
                    splToken.TOKEN_PROGRAM_ID   // programId
                )
            );

            // Sign and send the transaction
            const signature = await solanaWeb3.sendAndConfirmTransaction(
                connection,
                transaction,
                [fromWallet]
            );

            console.log(`${i++} Airdropped ${recipient.amount} tokens to ${recipient.address}. Transaction Signature: ${signature}`);
        }
    } catch (error) {
        console.error('Airdrop failed', error);
    }
}

// Start the airdrop
airdrop();
