import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Address autocomplete + verification via Google Places.
//   { input: "lekki phase" }  -> { suggestions: [{ placeId, main, secondary }] }
//   { placeId: "..." }        -> { address, lat, lng, street, area, city, state }
// Calls are made on user typing (debounced by the client), never on page load.

const LAGOS = { latitude: 6.5244, longitude: 3.3792 };

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // --- Resolve a picked suggestion into a clean address ---
    if (body.placeId) {
      const res = await base44.asServiceRole.connectors.callApi("google_maps", {
        method: "GET",
        host: "places",
        path: `/v1/places/${encodeURIComponent(String(body.placeId))}`,
        query: { fields: "id,formattedAddress,addressComponents,location" },
      });
      if (!res.success) {
        return Response.json(
          { error: res.data?.error?.message || "Could not verify this address" },
          { status: 400 }
        );
      }
      const comp = (type: string) =>
        (res.data?.addressComponents || []).find((c: any) => (c.types || []).includes(type))
          ?.longText || "";
      return Response.json({
        address: res.data?.formattedAddress || "",
        street: [comp("street_number"), comp("route")].filter(Boolean).join(" "),
        area: comp("sublocality_level_1") || comp("sublocality") || comp("neighborhood"),
        city: comp("locality") || comp("administrative_area_level_2"),
        state: comp("administrative_area_level_1"),
        lat: res.data?.location?.latitude ?? null,
        lng: res.data?.location?.longitude ?? null,
      });
    }

    // --- Suggest streets / areas as the customer types ---
    const input = String(body.input || "").trim();
    if (input.length < 3) return Response.json({ suggestions: [] });

    const res = await base44.asServiceRole.connectors.callApi("google_maps", {
      method: "POST",
      host: "places",
      path: "/v1/places:autocomplete",
      body: {
        input,
        includedRegionCodes: ["ng"],
        locationBias: { circle: { center: LAGOS, radius: 50000 } },
      },
    });
    if (!res.success) {
      return Response.json({ suggestions: [], error: res.data?.error?.message || "Search failed" });
    }

    const suggestions = (res.data?.suggestions || [])
      .map((s: any) => s.placePrediction)
      .filter(Boolean)
      .map((p: any) => ({
        placeId: p.placeId,
        main: p.structuredFormat?.mainText?.text || p.text?.text || "",
        secondary: p.structuredFormat?.secondaryText?.text || "",
      }));

    return Response.json({ suggestions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}