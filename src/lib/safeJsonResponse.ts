/**
 * Parses a fetch Response as JSON only when the body is actually JSON.
 * Avoids SyntaxError when Next.js or proxies return HTML error pages.
 */
export async function readJsonResponse<T>(res: Response): Promise<T | null> {
    const type = res.headers.get("content-type") ?? "";
    if (
        !type.includes("application/json")
        && !type.includes("application/geo+json")
        && !type.includes("+json")
    ) {
        return null;
    }

    try {
        return (await res.json()) as T;
    } catch {
        return null;
    }
}
