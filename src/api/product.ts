import request from "./request";
import type { Result } from "./request";

/**
 * 商品实体（对应后端 entity/Product，字段驼峰对应数据库下划线）
 */
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  merchantName: string;
  status: number;
  description: string | null;
  imageUrl: string | null;
  createTime: string;
  updateTime: string;
}

/** MP Page 序列化后本页用到的两个字段 */
export interface PageResult<T> {
  records: T[];
  total: number;
}

/**
 * C 端商品详情（对应后端 DTO ProductDetailResponse；免登录接口）
 * 注意：与实体 Product 不同，这里不含 status/createTime/updateTime，且 description/imageUrl 为 string
 */
export interface ProductDetail {
  id: number;
  name: string;
  price: number;
  stock: number;
  merchantName: string;
  description: string;
  imageUrl: string;
}

/** 商品表单（新增/编辑共用；库存、状态不在表单里——只能走入库/上下架接口） */
export interface ProductForm {
  name: string;
  price: number;
  merchantName: string;
  description: string;
  imageUrl: string;
}

/** 1. 录入商品：POST /api/admin/products，返回新商品 id */
export function createProduct(data: ProductForm) {
  return request.post<unknown, Result<number>>("/admin/products", data);
}

/** 2. 编辑商品：PUT /api/admin/products/{id} */
export function updateProduct(id: number, data: ProductForm) {
  return request.put<unknown, Result<void>>(`/admin/products/${id}`, data);
}

/** 3. 上下架：PUT /api/admin/products/{id}/status，body {status: 0|1} */
export function updateProductStatus(id: number, status: number) {
  return request.put<unknown, Result<void>>(`/admin/products/${id}/status`, {
    status,
  });
}

/** 4. 入库：POST /api/admin/products/{id}/stock-in，body {quantity} */
export function stockIn(id: number, quantity: number) {
  return request.post<unknown, Result<void>>(`/admin/products/${id}/stock-in`, {
    quantity,
  });
}

/** 5. 分页列表：GET /api/admin/products */
export function pageProducts(params: {
  page: number;
  size: number;
  keyword?: string;
  status?: number;
}) {
  return request.get<unknown, Result<PageResult<Product>>>("/admin/products", {
    params,
  });
}

/** 6. 图片上传：POST /api/admin/upload/image（form-data，字段名 file），返回相对 url */
export function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request.post<unknown, Result<string>>(
    "/admin/upload/image",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
}

/** 7. C 端商品列表：GET /api/products（免登录，只返回在售商品） */
export function getProductList(params: {
  page: number;
  size: number;
  keyword?: string;
}) {
  return request.get<unknown, Result<PageResult<ProductDetail>>>("/products", {
    params,
  });
}

/** 8. C 端商品详情：GET /api/products/{id}（免登录；不存在或已下架时后端返回业务错误即 reject） */
export function getProductDetail(id: number) {
  return request.get<unknown, Result<ProductDetail>>(`/products/${id}`);
}
