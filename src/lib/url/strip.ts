import $config from "../../config";

export default function stripProxy(url: any) {
  if (!url.pathname.startsWith($config.prefix)) {
    return false;
  }
  return $config.decodeURL(url.pathname.slice($config.prefix.length));
}

