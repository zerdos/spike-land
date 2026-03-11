/**
 * Cloudflare Workers extends CacheStorage with a .default property
 * that is not in the standard lib.dom.d.ts type definitions.
 */
interface CacheStorage {
  readonly default: Cache;
}

/**
 * The `duplex` property is required by the WHATWG Fetch spec when
 * streaming a request body. Neither lib.dom.d.ts nor
 * @cloudflare/workers-types currently declares it.
 */
interface RequestInit {
  duplex?: "half";
}
