import { parseDocument, DomUtils } from "htmlparser2";
import serialize from "dom-serializer";

import $config from "../../config";

function rewriteURL(url: string, base: string) {
  if (!url || typeof url !== "string") return url;

  const trimmed = url.trim();

  if (trimmed.toLowerCase().startsWith("javascript:")) {
    // TODO - JS rewriting
  }
  // just skip it
  if (
    trimmed.toLowerCase().startsWith("mailto:") ||
    trimmed.toLowerCase().startsWith("tel:")
  ) {
    return trimmed;
  }
  if (
    // by the way this is really retarded
    trimmed.toLowerCase().startsWith("data:") &&
    !trimmed.toLowerCase().startsWith("data:image/")
  ) {
    return "#";
  }
  if (trimmed.startsWith($config.prefix)) {
    return trimmed;
  }

  try {
    const resolvedUrl = new URL(trimmed, base).href;
    return $config.prefix + resolvedUrl;
  } catch {
    return trimmed;
  }
}

function getOrigin(url: any) {
  if (!url.pathname.startsWith($config.prefix)) {
    return false;
  }
  return $config.decodeURL(url.pathname.slice($config.prefix.length));
}

function rewriteHTML(input: string, url: any) {
  const origin = getOrigin(url);
  const base = new URL(origin);
  const dom = parseDocument(input);

  let toRewrite = new Set([
    "src",
    "href",
    "action",
    "formaction",
    "longdesc",
    "background",
    "cite",
    "data",
    "profile",
    "xlink:href",
    "usemap",
    "manifest",
    "archive",
    "codebase",
    "poster",
  ]);

  const targets = DomUtils.findAll(
    (el) => el.attribs && Object.keys(el.attribs).some((a) => toRewrite.has(a)),
    dom,
  );

  targets.forEach((el) => {
    Object.keys(el.attribs).forEach((a) => {
      if (toRewrite.has(a)) {
        el.attribs[`latens-origattr-${a}`] = el.attribs[a];
        el.attribs[a] = rewriteURL(el.attribs[a], base.origin);
      }
    });
  });

  let stringed = serialize(dom);
  return stringed.replace(
    /<head(\s*[^>]*)?>/,
    (match) =>
      `${match}\n<script src="${$config.configUrl}"></script><script src="${$config.clientUrl}"></script>`,
  );
}

export { rewriteHTML };
