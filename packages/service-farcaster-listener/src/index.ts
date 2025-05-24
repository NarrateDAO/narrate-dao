// NarrateDAO OS: Farcaster Listener Service
// Purpose: Securely and reliably listen to and parse specific governance-related Casts from Farcaster.
// This service acts as a webhook receiver for Farcaster events, processing relevant casts
// and forwarding them to other services like the AI Intent Service.

import express from 'express';
import bodyParser from 'body-parser';
import { verifyNeynarWebhookSignature } from './utils/neynarSignatureVerifier'; // You'll implement this
// Assume a type definition for incoming Farcaster Cast data
// This would ideally be in lib-core-types
interface FarcasterCast {
  hash: string; // Unique identifier for the cast
  author: {
    fid: number; // Farcaster ID of the author
    username?: string; // Username of the author
    displayName?: string; // Display name of the author
  };
  text: string; // The main text content of the cast
  timestamp: string; // ISO 8601 timestamp of the cast
  embeds?: any[]; // Array of embeds (e.g., URLs, media)
  mentions?: { fid?: number; username?: string; pfp_url?: string }[]; // Array of mentioned users
  // ... other relevant fields from Farcaster webhook payload
}

// Assume interfaces for the parsed data structure and downstream services
// These would ideally be in lib-core-types
interface ParsedCastData {
  castHash: string;
  authorFid: number;
  text: string;
  timestamp: string;
  // Add other parsed fields as needed, e.g., extracted tags, mentioned fids
}

// Placeholder for downstream service clients (e.g., AI Intent Service client)
// In a real application, these would be proper client instances for inter-service communication
const aiIntentService = {
  processCast: async (data: ParsedCastData) => {
    console.log(`[FarcasterListener] Forwarding cast ${data.castHash} to AI Intent Service`);
    // TODO: Implement actual communication with AI Intent Service API
    // Example: await axios.post('http://ai-intent-service/process', data);
  }
};

const dataPersistenceService = {
  saveRawCast: async (cast: FarcasterCast) => {
    console.log(`[FarcasterListener] Saving raw cast ${cast.hash} to Data Persistence Service`);
    // TODO: Implement actual communication with Data Persistence Service API
    // Example: await axios.post('http://data-persistence-service/save/raw', cast);
  }
};


/**
 * Parses relevant data from an incoming Farcaster Cast object.
 * @param cast - The raw Farcaster Cast object received from the webhook.
 * @returns ParsedCastData object containing extracted information.
 */
export function parseCastContent(cast: FarcasterCast): ParsedCastData {
  // TODO: Implement more sophisticated parsing and data extraction as needed.
  // This is a basic example extracting core fields.
  return {
    castHash: cast.hash,
    authorFid: cast.author.fid,
    text: cast.text,
    timestamp: cast.timestamp,
    // Add parsing for embeds, mentions, tags (#DAOProposal) here
    // Example: extractTags(cast.text)
  };
}

/**
 * Performs preliminary filtering to check if a cast is relevant for governance.
 * MVP criteria could be presence of a specific hashtag like #DAOProposal or mention of a specific FID.
 * @param cast - The raw Farcaster Cast object.
 * @returns boolean - True if the cast is considered relevant, false otherwise.
 */
function isCastRelevant(cast: FarcasterCast): boolean {
  // MVP Filtering Logic Example: Check for #DAOProposal hashtag
  const requiredHashtag = '#DAOProposal';
  const isRelevant = cast.text.includes(requiredHashtag);

  if (!isRelevant) {
    console.log(`[FarcasterListener] Filtering out cast ${cast.hash}: missing ${requiredHashtag}`);
  }

  // TODO: Add more sophisticated filtering criteria if required by MVP specs,
  // e.g., checking mentions, origin of the cast (specific channel).

  return isRelevant;
}


// Express app setup for webhook receiver
const app = express();
const PORT = process.env.PORT || 3000;

// Use raw body for signature verification
app.use(bodyParser.json({
    verify: (req: any, res, buf) => {
        // Store the raw body for signature verification later
        req.rawBody = buf;
    }
}));

/**
 * Webhook endpoint to receive incoming Farcaster Casts.
 */
app.post('/farcaster/webhook', async (req, res) => {
    console.log('Received Farcaster webhook!');

    // --- MVP Security Step: Verify Webhook Signature ---
    // Neynar sends a signature in the 'x-neynar-signature' header.
    // You should verify this signature against your Neynar API key and the raw request body
    // to ensure the webhook is truly from Neynar and hasn't been tampered with.
    // THIS IS CRUCIAL FOR SECURITY.
    const signature = req.headers['x-neynar-signature'] as string;
    const rawBody = (req as any).rawBody;

    try {
        // Ensure NEYNAR_API_KEY is defined before using it
        const neynarApiKey = process.env.NEYNAR_API_KEY;
        if (!neynarApiKey) {
            console.error('NEYNAR_API_KEY is not set.');
            return res.status(500).send('Internal Server Error: API key not configured');
        }

        const isSignatureValid = verifyNeynarWebhookSignature(signature, rawBody.toString('utf8'), neynarApiKey);
        if (!isSignatureValid) {
            console.warn('Invalid Neynar webhook signature. Ignoring request.');
            return res.status(401).send('Unauthorized: Invalid Signature');
        }
    } catch (error) {
        console.error('Error verifying webhook signature:', error);
        return res.status(500).send('Internal Server Error during signature verification');
    }
    // --- End Signature Verification ---

    const event = req.body; // This will be the Farcaster event payload

    // You'll need to inspect the event.type to determine how to process it
    // Examples of event.type: 'cast.created', 'reaction.created', etc.
    // The actual data payload will be in event.data

    if (event.type === 'cast.created') {
        const cast = event.data.cast;
        console.log(`New Cast by @${cast.author.username} (${cast.author.fid}): ${cast.text}`);

        // TODO:
        // 1. Store raw cast in FarcasterCasts table (Data Persistence Service)
        // 2. Push to AI Intent Service for processing (e.g., via internal message queue or direct function call)
        //    For MVP, you might directly call a function from your AI Intent Service module.
        //    Example: await aiIntentService.processFarcasterCast(cast);

        // Example: Call your data persistence logic (conceptual)
        // await dataPersistenceService.saveRawCast({
        //     cast_hash: cast.hash,
        //     author_fid: cast.author.fid,
        //     text: cast.text,
        //     raw_data_json: cast // Store the full raw payload
        // });

        // Example: Trigger AI Intent Service (conceptual)
        // await aiIntentService.processCastForIntent(cast.text, cast.hash);

    } else if (event.type === 'reaction.created') {
        // Handle reactions if needed for reputation or other features
        console.log(`New reaction on cast ${event.data.reaction.target_hash} by ${event.data.reaction.reactor.username}`);
    }
    // ... handle other event types

    res.status(200).send('Webhook received and processed');
});

app.listen(PORT, () => {
    console.log(`Farcaster Listener Service running on port ${PORT}`);
});

// // Example of how to start the listener (usually done in a main application file)
// if (require.main === module) {
//   startWebhookListener();
// } 