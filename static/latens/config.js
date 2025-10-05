self.__$latens$config = {
    prefix: "/latens/service/",
    configUrl: "/latens/config.js",
    clientUrl: "/latens.client.js",
    errorPage: "/index.html",

    // end user needs to make it themselves
    encodeURL: x => encodeURIComponent(x),
    decodeURL: x => decodeURIComponent(x)

    
}