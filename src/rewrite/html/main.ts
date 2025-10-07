import { parseDocument, DomUtils } from "htmlparser2";
import serialize from "dom-serializer";

import $config from "../../config";
import $lib from "../../lib/main"

function rewriteHTML(input: string, url: any) {
  const origin = $lib.url.strip(url);
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
        el.attribs[a] = $lib.url.rewrite(el.attribs[a], base.origin);
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
