import $config from "../config";
import { BareClient } from "@mercuryworkshop/bare-mux";

let client: any;
const routeLatens = async function (request: any) {
  try {
    const url = new URL(request.url);
    if (url.pathname.startsWith($config.prefix)) {
      client = new BareClient();

      const targetUrl = $config.decodeURL(
        url.pathname.slice($config.prefix.length),
      );
      console.log(`[SW] fetching ${targetUrl}`);

      const response = await client.fetch(targetUrl, {
        headers: new Headers(request.headers),
      });

      const mime = response.headers.get("Content-Type") || "";

      const headers = new Headers(response.headers);
      headers.set("X-Frame-Options", "SAMEORIGIN");
      headers.delete("Content-Security-Policy");
      headers.delete("Content-Security-Policy-Report-Only");

      if (
        mime.includes("text/html") ||
        mime.includes("application/xhtml+xml")
      ) {
        const text = await response.text();
        return new Response(text, { headers });
      }
      if (
        mime.includes("application/javascript") ||
        mime.includes("text/javascript")
      ) {
        const text = await response.text();
        return new Response(text, { headers });
      }

      // for everything thats not rewritten, stream
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    return fetch(request);
  } catch (e: any) {
    return new Response(e, {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
};

// @ts-ignore
self.routeLatens = routeLatens