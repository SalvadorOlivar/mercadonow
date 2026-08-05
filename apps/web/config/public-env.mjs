export function resolvePublicApiUrl(environment) {
  const value = environment.NEXT_PUBLIC_API_URL;
  if ((value === undefined || value === "") && environment.NODE_ENV === "development") {
    return "http://localhost:3001";
  }
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("NEXT_PUBLIC_API_URL is required outside development");
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL must be a valid HTTP(S) URL");
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new Error("NEXT_PUBLIC_API_URL must be a valid HTTP(S) URL");
  }
  return url.toString().replace(/\/$/, "");
}
