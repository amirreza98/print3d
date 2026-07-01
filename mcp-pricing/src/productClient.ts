/** A single material/size rate line from product-service's product detail response. */
export interface MaterialRate {
  material: string;
  sizeLabel: string;
  pricePerGram: number;
}

/** The subset of GET /api/products/{id} that pricing depends on. */
export interface ProductDetail {
  id: string;
  name: string;
  availableMaterials: string[];
  materialPrices: MaterialRate[];
}

/** product-service could not be reached or returned an unexpected status. */
export class ProductServiceError extends Error {}

/** The requested product slug does not exist (HTTP 404). */
export class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Unknown product '${productId}'`);
  }
}

/**
 * Thin HTTP client for product-service. product-service owns the material_price rates;
 * this client just reads them. Uses the global fetch (Node 18+).
 */
export class ProductClient {
  constructor(private readonly baseUrl: string) {}

  async getProduct(productId: string): Promise<ProductDetail> {
    const url = `${this.baseUrl}/api/products/${encodeURIComponent(productId)}`;

    let response: Response;
    try {
      response = await fetch(url, { headers: { Accept: "application/json" } });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      throw new ProductServiceError(`Could not reach product-service at ${url}: ${message}`);
    }

    if (response.status === 404) {
      throw new ProductNotFoundError(productId);
    }
    if (!response.ok) {
      throw new ProductServiceError(
        `product-service returned ${response.status} ${response.statusText} for ${url}`,
      );
    }

    const data = (await response.json()) as ProductDetail;
    if (!Array.isArray(data.materialPrices)) {
      throw new ProductServiceError(
        `product-service response for '${productId}' is missing materialPrices`,
      );
    }
    return data;
  }
}
