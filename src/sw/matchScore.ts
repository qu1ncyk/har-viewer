import { last } from "../utils";

/**
 * Gives a score based on how good the URLs match. A lower score means a
 * better match.
 * @param requestedUrl The URL that has been requested
 * @param otherUrl A URL from the collection
 */
export function matchScore(requestedUrl: URL, otherUrl: URL) {
  let score = 0;

  score += paramsScore(requestedUrl.searchParams, otherUrl.searchParams);
  score += pathnameScore(requestedUrl.pathname, otherUrl.pathname);

  if (requestedUrl.protocol !== otherUrl.protocol)
    score += 10;
  if (requestedUrl.host !== otherUrl.host)
    score += 20;

  return score;
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

function pathnameScore(requestedPathname: string, otherPathname: string) {
  const requestedPathComponents = requestedPathname.split("/");
  const otherPathComponents = otherPathname.split("/");
  const minLength = Math.min(requestedPathComponents.length, otherPathComponents.length);
  const lengthDifference = requestedPathComponents.length - otherPathComponents.length;

  let score = 0;

  // if one of the urls ends with a slash, but they otherwise have the same
  // number of components, add 0.25
  if (lengthDifference === 1 && last(requestedPathComponents) === ""
    || lengthDifference === -1 && last(otherPathComponents) === "")
    score += 0.25;
  else
    // else add 2 for each component that is too many
    score += 2 * Math.abs(lengthDifference);

  for (let i = 0; i < minLength; i++) {
    const value = requestedPathComponents[i];
    const otherValue = otherPathComponents[i];

    if (value === otherValue) continue;

    if (value.length === otherValue.length)
      score += 0.75;
    else
      score++;
  }

  // if the file extensions are the same, remove 0.25 of the score
  const requestedFile = last(requestedPathComponents);
  const otherFile = last(otherPathComponents);
  if (requestedFile.includes(".") && otherFile.includes(".") && requestedFile !== otherFile) {
    const requestedFileExtension = last(requestedFile.split("."));
    const otherFileExtension = last(otherFile.split("."));

    if (requestedFileExtension === otherFileExtension) score -= 0.25;
  }

  return score;
}