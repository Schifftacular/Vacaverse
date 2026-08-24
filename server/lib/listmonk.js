// Sends transactional invite emails through a self-hosted Listmonk instance's
// /api/tx endpoint (Listmonk itself relays outbound mail through Resend SMTP —
// see deploy/listmonk/docker-compose.yml). One shared transactional template,
// data-driven by target_type/name/join_url, so trip vs family invites don't
// need separate Listmonk templates.

const LISTMONK_URL = process.env.LISTMONK_URL;
const LISTMONK_API_USER = process.env.LISTMONK_API_USER;
const LISTMONK_API_TOKEN = process.env.LISTMONK_API_TOKEN;
const LISTMONK_TX_TEMPLATE_ID = process.env.LISTMONK_TX_TEMPLATE_ID;

export async function sendInviteEmail({ email, targetType, targetName, joinUrl }) {
    if (!LISTMONK_URL || !LISTMONK_API_USER || !LISTMONK_API_TOKEN || !LISTMONK_TX_TEMPLATE_ID) {
        const err = new Error('Email delivery is not configured');
        err.status = 503;
        throw err;
    }

    const res = await fetch(`${LISTMONK_URL}/api/tx`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${LISTMONK_API_USER}:${LISTMONK_API_TOKEN}`).toString('base64')}`,
        },
        body: JSON.stringify({
            subscriber_email: email,
            // Invitees are arbitrary emails, not people who've ever
            // subscribed in Listmonk — the default subscriber_mode requires
            // an existing subscriber record and 400s otherwise. "external"
            // sends straight to the address with no subscriber lookup.
            subscriber_mode: 'external',
            template_id: Number(LISTMONK_TX_TEMPLATE_ID),
            data: { target_type: targetType, name: targetName, join_url: joinUrl },
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        const err = new Error(`Listmonk send failed: ${res.status} ${body}`);
        err.status = 502;
        throw err;
    }
}
