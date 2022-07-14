// This file contains parts that are borrowed from
// https://github.com/webrecorder/wabac.js under AGPLv3+

export function rewriteWorker(js: string, url: string, collection: string) {
  const encodedCollection = encodeURIComponent(collection);
  const basePrefixTS = `${location.origin}/view/${encodedCollection}/0`;
  
  const wombatConfig = {
    prefix: `${basePrefixTS}/`,
    prefixMod: `${basePrefixTS}wkrf_/`,
    originalURL: url
  };

  return `
    (function() {
      self.importScripts("https://cdn.jsdelivr.net/npm/@webrecorder/wombat@3.3.6/dist/wombatWorkers.js");
      new WBWombat(${JSON.stringify(wombatConfig)});
    })();
    ${js}`;
}