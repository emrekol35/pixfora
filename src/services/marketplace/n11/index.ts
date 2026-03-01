// N11 Marketplace Integration
// Central exports

// Client
export {
  N11Client,
  getN11Client,
  isN11Configured,
  resetN11Client,
  type N11Credentials,
} from "./client";

// Categories
export {
  getAllCategories,
  getCategoryAttributes,
  flattenCategories,
  type N11CategoryNode,
  type N11CategoryAttribute,
  type N11CategoryAttributeResponse,
} from "./categories";

// Products
export {
  createProducts,
  updatePriceStock,
  getTaskDetails,
  listProducts,
  mapProductToN11,
  type N11SkuItem,
  type N11TaskResponse,
  type N11TaskDetailResponse,
  type N11RemoteProduct,
  type N11ProductListResponse,
  type LocalProductForN11,
} from "./products";

// Orders
export {
  getOrders,
  approveOrderLines,
  mapN11OrderToLocal,
  type N11ShipmentPackage,
  type N11OrderLine,
  type N11OrderFilterParams,
  type N11ShipmentPackagesResponse,
  type MappedN11Order,
} from "./orders";
