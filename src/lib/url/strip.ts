import $config from "../../config";

export default function stripProxy(url: any) {
  // Save in the case that you dont actually need to rewrite it
  let original;
  // convert to URL object
  if (typeof url == "string") {
    original = url;
    url = new URL(url, window.origin);
  } 
  try {
      if (!url.pathname.startsWith($config.prefix)) {
        return original;
      }
  } catch (e) {
    console.error("???? I dont even know how " + e + " happened" );
    console.log(`TYPE ${typeof url} CONTENTS ${url}`)
  }
  return $config.decodeURL(url.pathname.slice($config.prefix.length));
}
