import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { serverUrl, clientId, clientSecret } = await req.json();

  if (!serverUrl || !clientId || !clientSecret) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const base = serverUrl.replace(/\/$/, "");

  try {
    // Step 1: Get a bearer token using OAuth2 client credentials
    const tokenRes = await fetch(`${base}/api/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("Token error:", text);
      return NextResponse.json(
        { error: "Authentication failed. Check your Client ID and Secret." },
        { status: 401 }
      );
    }

    const { access_token } = await tokenRes.json();

    // Step 2: Hit the computers inventory endpoint to validate + get count
    const inventoryRes = await fetch(
      `${base}/api/v1/computers-inventory?page=0&page-size=1&section=GENERAL`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      }
    );

    if (!inventoryRes.ok) {
      return NextResponse.json(
        { error: "Connected but could not fetch inventory. Check API role permissions." },
        { status: 403 }
      );
    }

    const inventory = await inventoryRes.json();
    const deviceCount = inventory.totalCount ?? 0;

    // Step 3: Get instance name from server info
    let instanceName = base.replace("https://", "").replace(".jamfcloud.com", "");
    try {
      const infoRes = await fetch(`${base}/api/v1/jamf-pro-information`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (infoRes.ok) {
        const info = await infoRes.json();
        instanceName = info.instanceName || instanceName;
      }
    } catch {
      // Non-critical, just use URL-derived name
    }

    return NextResponse.json({ success: true, deviceCount, instanceName });
  } catch (err) {
    console.error("Jamf connection error:", err);
    return NextResponse.json(
      { error: "Could not reach Jamf Pro. Check the server URL." },
      { status: 500 }
    );
  }
}
