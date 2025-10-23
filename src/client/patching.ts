import $lib from "../lib/main"
import $config from "../config"
import { rewriteHTML } from "../rewrite/html/main";

interface patchRegistry {
    elements: Function[];
    properties: string[];
    handler: "url" | "html" | "delete" | "window";
}


function getOrigin(url: any) {
  const u = url instanceof URL ? url : new URL(url);
  if (!u.pathname.startsWith($config.prefix)) return false;
  return $config.decodeURL(u.pathname.slice($config.prefix.length));
}



// ripped from https://github.com/titaniumnetwork-dev/Corrosion/blob/main/lib/browser/document.js
// i understand it is old and useless BUT i garuntee EV is going to see this comment and get pissed off enough to make a PR and change it
let registry: patchRegistry[] = [
  {
    elements: [
      HTMLScriptElement,
      HTMLMediaElement,
      HTMLImageElement,
      HTMLAudioElement,
      HTMLVideoElement,
      HTMLInputElement,
      HTMLEmbedElement,
      HTMLIFrameElement,
      HTMLTrackElement,
      HTMLSourceElement,
    ],
    properties: ["src"],
    handler: "url",
  },
  {
    elements: [HTMLFormElement],
    properties: ["action"],
    handler: "url",
  },
  {
    elements: [
      HTMLAnchorElement,
      HTMLAreaElement,
      HTMLLinkElement,
      HTMLBaseElement,
    ],
    properties: ["href"],
    handler: "url",
  },
  {
    elements: [HTMLImageElement, HTMLSourceElement],
    properties: ["srcset"],
    handler: "html",
  },
  {
    elements: [HTMLScriptElement],
    properties: ["integrity"],
    handler: "delete",
  },
  {
    elements: [HTMLIFrameElement],
    properties: ["contentWindow"],
    handler: "window",
  },
];


registry.forEach((entry) => {
    let loopover = entry.elements
    let property = entry.properties[0] // TODO - loop system instead of just grabbing the first
    let handler = entry.handler

    if (handler === "url") {
        loopover.forEach((element) => {
            const descriptor = Object.getOwnPropertyDescriptor(element.prototype, property);
            if (!descriptor) {console.log("ERROR IN GETTING DESCRIPTOR FOR " + element); return;} 
            Object.defineProperty(element.prototype, property, {
                get() {
                    return this.getAttribute(`latens-origattr-${property}`)
                },
            set: descriptor.set ? new Proxy(descriptor.set!, {
            apply(target: Function, thisArg: any, args: any[]) {
                thisArg.setAttribute(`latens-origattr-${property}`, args[0])
                let rewritten = $lib.url.rewrite(args[0], getOrigin(location.href))
                return Reflect.apply(target, thisArg, [rewritten])
            }
            }) as (v: any) => void : undefined

            })
        })
    }
    if (handler === "delete") {

    }
    if (handler === "window") {

    }
    if (handler === "html") {

    }
})

Element.prototype.getAttribute = new Proxy(Element.prototype.getAttribute, {
  apply: (target, thisArg, args) => {
    if (args[0] && thisArg.hasAttribute(`latens-origattr-${args[0]}`)) args[0] = `latens-origattr-${args[0]}`;
    return Reflect.apply(target, thisArg, args);
  },
})

Document.prototype.write = new Proxy(Document.prototype.write, {
  apply:(target, thisArg, args) => {
    if (args.length === 1) { 
      args[0] = rewriteHTML(args[0], location.href);
      return Reflect.apply(target, thisArg, args);
    }
  }
})