import $config from "../config";

import { BareClient } from "@mercuryworkshop/bare-mux";

import { rewriteHTML } from "../rewrite/html/main";
import { rewriteJS } from "../rewrite/js/main";

let client: any;
const routeLatens = async function (request: any) {
  try {
    const url = new URL(request.url);
    // force through the proxy
    if (url.hostname != self.location.hostname) {
      client = new BareClient();
      console.log(`[SW] fetching leak on ${url.href} with wisp`);
      return client.fetch(url);
    }
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

      // todo: make this less stupid
      headers.set("X-Frame-Options", "SAMEORIGIN");
      headers.delete("Content-Security-Policy");
      headers.delete("Content-Security-Policy-Report-Only");

      if (
        mime.includes("text/html") ||
        mime.includes("application/xhtml+xml")
      ) {
        let fHTML = await response.text();
        fHTML = rewriteHTML(fHTML, url);
        return new Response(fHTML, { headers });
      }
      if (
        mime.includes("application/javascript") ||
        mime.includes("text/javascript")
      ) {
        let text = await response.text();
        text = rewriteJS(text)
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
self.routeLatens = routeLatens;
