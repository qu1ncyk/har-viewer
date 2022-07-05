// This file contains parts that are borrowed from
// https://github.com/webrecorder/wabac.js under AGPLv3+

export function rewriteJs(js: string, url: string, collection: string) {
  // https://github.com/webrecorder/wabac.js/blob/4da4093d15b8a182eba18615ab378cab8bf01479/src/rewrite/jsrewriter.js#L114

  const overriddenGlobals = ["window", "self", "document", "location", "top", "parent", "frames", "opener"];

  return `
    if (!self.__WB_pmw) {
      self.__WB_pmw = function(obj) {
        this.__WB_source = obj;
        return this;
      };
    }

    function _____WB$wombat$assign$function_____(name) {
      return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name)) || self[name];
    }

    {
      ${overriddenGlobals
      .map(x => `let ${x} = _____WB$wombat$assign$function_____("${x}");`)
      .join("\n")}

      // let arguments;

      ${js}
    }
  `;
}