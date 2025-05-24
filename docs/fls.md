## 1. Set Up Your Webhook Endpoint

Before you can register a webhook with Farcaster, you need a publicly accessible URL where Farcaster can send its event notifications. This will be the endpoint for your **Farcaster Listener Service**.

Here's how you can approach this for development and production:

* **For Development:**
    * **Ngrok:** This is highly recommended for local development. Ngrok creates a secure tunnel from a public URL to your local machine. This allows Farcaster to send webhooks to your local development server, even if it's running behind a firewall.
        * **How to use:**
            1.  Install Ngrok if you haven't already.
            2.  Start your local Farcaster Listener Service (e.g., `node your-listener-service.js` or `npm run dev`). Make sure you know the port it's running on (e.g., 3000, 8080).
            3.  Run `ngrok http <YOUR_PORT_NUMBER>` (e.g., `ngrok http 3000`).
            4.  Ngrok will give you a public URL (e.g., `https://xxxx-xx-xxx-xxx.ngrok-free.app`). This is the URL you'll register with Farcaster.
* **For Production:**
    * **Cloud Hosting:** Deploy your Farcaster Listener Service to a cloud provider like AWS, Google Cloud, Azure, Vercel, or DigitalOcean. Your deployed service will have a public URL that Farcaster can reach. Ensure your server is configured to listen for incoming POST requests at that URL.

---

## 2. Understand Farcaster Webhooks

Farcaster webhooks are typically managed through **Neynar** or by interacting directly with the **Farcaster Hubs**.

* **Neynar:** Neynar is a Farcaster API provider that simplifies interactions with the Farcaster protocol, including webhook management. This is often the easiest path for many developers.
* **Farcaster Hubs:** If you're running your own Farcaster Hub or interacting with one directly, you'd configure webhooks there. This is more involved and might be considered for later stages of decentralization.

For the MVP, I'll focus on Neynar, as it's generally more straightforward.

---

## 3. Registering the Webhook with Neynar (Recommended for MVP)

Neynar provides an API for managing webhooks. You'll use their **"Create Webhook" endpoint**.

**Prerequisites:**

* **Neynar API Key:** You'll need to sign up for a Neynar account and obtain an API key. Keep this key secure!
* **Webhook Endpoint URL:** The public URL of your Farcaster Listener Service (from Step 1).

**Steps:**

1.  **Identify Event Types:** Determine which Farcaster events you want to subscribe to. For NarrateDAO, you'll likely be interested in:
    * `cast.created`: To capture new casts.
    * `cast.deleted`: (Optional) To handle deleted casts.
    * `reaction.created` / `reaction.deleted`: (Optional) If you want to track likes/recasts for reputation.
    * `mentions`: If you want to specifically listen for casts mentioning your DAO's FID or username.
    * `reply.created`: For replies to casts.

2.  **Make an API Request to Neynar:** You'll make a `POST` request to Neynar's webhook creation endpoint.

    Here's a conceptual example using `curl` (you'd translate this to your Node.js backend using `axios` or `Workspace`):

    ```bash
    curl -X POST \
      https://api.neynar.com/v2/farcaster/webhooks \
      -H 'accept: application/json' \
      -H 'api_key: YOUR_NEYNAR_API_KEY' \
      -H 'Content-Type: application/json' \
      -d '{
        "url": "YOUR_PUBLIC_WEBHOOK_URL",
        "name": "NarrateDAO_Listener_MVP",
        "channels": ["CHANNEL_ID_OR_NAME"], # Optional: Filter by specific Farcaster channels
        "fids": [123, 456], # Optional: Filter by specific Farcaster IDs
        "webhook_events": [
          "cast.created",
          "cast.deleted" # Add other events you need
        ],
        "is_active": true
      }'
    ```

    **Key Parameters:**

    * `url`: Your public webhook endpoint URL.
    * `name`: A descriptive name for your webhook.
    * `channels`: An array of Farcaster channel IDs or names (e.g., `["degen", "build"]`) to listen for events only within those channels. This is highly recommended to reduce noise.
    * `fids`: An array of specific Farcaster IDs (FIDs) to listen for events from. Useful if you're only interested in specific accounts.
    * `webhook_events`: An array of the specific event types you want to receive.
    * `is_active`: Set to `true` to enable the webhook immediately.

3.  **Handle the Response:** Neynar's API will return a response indicating the success or failure of the webhook creation, including a webhook ID. Store this ID as it will be useful for managing (updating or deleting) the webhook later.

---

## 4. Implement Your Farcaster Listener Service (Node.js/Express.js Example)

On your backend, you'll set up an Express.js server to listen for POST requests at the specified `url`.

```typescript
// service-farcaster-listener/src/index.ts (conceptual)

import express from 'express';
import bodyParser from 'body-parser';
import { verifyNeynarWebhookSignature } from './utils/neynarSignatureVerifier'; // You'll implement this

const app = express();
const PORT = process.env.PORT || 3000;

// Use raw body for signature verification
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        // Store the raw body for signature verification later
        (req as any).rawBody = buf;
    }
}));

// Your webhook endpoint
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
        const isSignatureValid = verifyNeynarWebhookSignature(signature, rawBody.toString('utf8'), process.env.NEYNAR_API_KEY!);
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
```

### Important: Webhook Signature Verification

The `verifyNeynarWebhookSignature` function is **critical**. Neynar signs webhook payloads to ensure authenticity and integrity. You **must** verify this signature using your Neynar API key and the raw request body. If the signature is invalid, you should reject the request.

You can find official documentation or community examples on how to implement this, but it generally involves:

1.  Retrieving the `x-neynar-signature` header.
2.  Using a cryptographic library (like Node's `crypto` module) to compute an HMAC SHA256 hash of the raw request body, using your Neynar API key as the secret.
3.  Comparing your computed hash with the hash provided in the `x-neynar-signature` header.

---
