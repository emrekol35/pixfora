// Trendyol Marketplace Service — Ana Export Dosyası

export {
  TrendyolClient,
  getTrendyolClient,
  isTrendyolConfigured,
  resetTrendyolClient,
  type TrendyolCredentials,
} from "./client";

export {
  createProducts,
  updateProducts,
  updatePriceAndInventory,
  filterProducts,
  deleteProducts,
  checkBatchResult,
  mapProductToTrendyol,
  type TrendyolProductItem,
  type TrendyolPriceStockItem,
  type TrendyolBatchResponse,
  type TrendyolBatchResult,
  type TrendyolFilterParams,
  type TrendyolProductListResponse,
  type TrendyolRemoteProduct,
  type LocalProductForTrendyol,
} from "./products";

export {
  getShipmentPackages,
  updatePackageStatus,
  updateTrackingNumber,
  splitShipmentPackage,
  sendInvoiceLink,
  mapTrendyolOrderToLocal,
  type TrendyolShipmentPackage,
  type TrendyolShipmentPackageListResponse,
  type TrendyolOrderLine,
  type TrendyolAddress,
  type ShipmentPackageFilterParams,
  type MappedTrendyolOrder,
} from "./orders";

export {
  getCategoryTree,
  getCategoryAttributes,
  getBrands,
  searchBrandByName,
  getCargoProviders,
  flattenCategoryTree,
  type TrendyolCategoryNode,
  type TrendyolCategoryAttribute,
  type TrendyolCategoryAttributesResponse,
  type TrendyolBrandItem,
  type TrendyolCargoProvider,
} from "./categories";
