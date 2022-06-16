/**
 * Gives a score based on how good the URLs match. A lower score means a
 * better match.
 * @param requestedUrl The URL that has been requested
 * @param otherUrl A URL from the collection
 */
export function matchScore(requestedUrl: string, otherUrl: string) {

}

/**
 * Gives a score based on how good the parameters match. The score increases by
 * 1 for each parameter that is present in both `URLSearchParams`es, but is not
 * the same, increases by 0.75 if the parameters are also have the same length,
 * and increases by 2 for each parameter that is present in only one of them.
 */
function paramsScore(requestedParams: URLSearchParams, otherParams: URLSearchParams) {
  let score = 0;
  for (const [key, value] of requestedParams) {
    const otherValue = otherParams.get(key);

    if (otherValue === null) {
      score += 2;
      continue;
    }

    if (value !== otherValue) {
      if (value.length === otherValue.length)
        score += 0.75;
      else
        score++;
    }
    otherParams.delete(key);
  }


  // the remaining parameters are just in `otherParams` and not in `requestedParams`
  score += 2 * [...otherParams].length;

  return score;
}