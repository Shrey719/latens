import $config from "../../config";
import { rewriteJS } from "../../rewrite/js/main";

export default function rewrite(url: string, base: string) {
  if (!url || typeof url !== "string") return url;

  const trimmed = url.trim();
  const lowerCaseTrimmed = trimmed.toLowerCase();

  if (lowerCaseTrimmed.startsWith("javascript:")) {
    // "javascript:" is 11 chars long
    return "javascript:"+ rewriteJS(url.slice(11))
  }

  // skip
  if (
    lowerCaseTrimmed.startsWith("mailto:") ||
    lowerCaseTrimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  if (
    // by the way this is really retarded
    lowerCaseTrimmed.startsWith("data:") &&
    !lowerCaseTrimmed.startsWith("data:image/")
  ) {
    return "#";
  }
  // already rewritten - ignore
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
