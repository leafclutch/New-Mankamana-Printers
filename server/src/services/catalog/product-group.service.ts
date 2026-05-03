import prisma from "../../connect";
import { ApiError } from "../../utils/api-error";
import { withCache } from "../../utils/cache";
import { getPublicUrlForPath } from "../../utils/file-upload";
import { invalidateCatalogGroupCache } from "./catalog-cache.service";

const CATALOG_GROUP_BROWSE_TTL_MS = 60_000;
const CATALOG_GROUP_DETAIL_TTL_MS = 60_000;

const toPublicAssetUrl = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("http")) return value;
  if (value.startsWith("/")) return value;
  return getPublicUrlForPath(value);
};

const resolveCatalogImage = (
  primary: string | null | undefined,
  fallbacks: Array<string | null | undefined> = []
): string | null => {
  const candidates = [primary, ...fallbacks];
  for (const candidate of candidates) {
    const resolved = toPublicAssetUrl(candidate);
    if (resolved) return resolved;
  }
  return null;
};

// Returns the unified catalog for the client browse page:
// - active groups (with their sub-product count)
// - active standalone products (no group_id)
export const listCatalogService = async () => {
  return withCache("catalog:browse", CATALOG_GROUP_BROWSE_TTL_MS, async () => {
    const [groups, standaloneProducts] = await Promise.all([
      prisma.productGroup.findMany({
        where: { is_active: true },
        select: {
          id: true,
          group_code: true,
          name: true,
          description: true,
          image_url: true,
          category: {
            select: {
              image_url: true,
            },
          },
          products: {
            where: { is_active: true },
            select: {
              id: true,
              image_url: true,
              preview_images: true,
            },
          },
        },
        orderBy: { created_at: "asc" },
      }),
      prisma.product.findMany({
        where: { is_active: true, group_id: null },
        select: {
          id: true,
          product_code: true,
          name: true,
          description: true,
          image_url: true,
          preview_images: true,
          production_days: true,
        },
        orderBy: { created_at: "asc" },
      }),
    ]);

    return {
      groups: groups.map((g) => {
        const firstProductImage =
          g.products
            .map((p) => resolveCatalogImage(p.image_url, p.preview_images))
            .find((value): value is string => Boolean(value)) ?? null;

        return {
          id: g.id,
          group_code: g.group_code,
          name: g.name,
          description: g.description,
          image_url: resolveCatalogImage(g.image_url, [g.category?.image_url, firstProductImage]),
          product_count: g.products.length,
          type: "group" as const,
        };
      }),
      products: standaloneProducts.map((p) => ({
        id: p.id,
        product_code: p.product_code,
        name: p.name,
        description: p.description,
        image_url: resolveCatalogImage(p.image_url, p.preview_images),
        production_days: Number(p.production_days),
        type: "product" as const,
      })),
    };
  });
};

// Returns a group with all its active sub-products
export const getProductGroupService = async (groupId: string) => {
  return withCache(`catalog:group:${groupId}`, CATALOG_GROUP_DETAIL_TTL_MS, async () => {
    const group = await prisma.productGroup.findFirst({
      where: { id: groupId, is_active: true },
      select: {
        id: true,
        group_code: true,
        name: true,
        description: true,
        image_url: true,
        category: {
          select: {
            image_url: true,
          },
        },
        products: {
          where: { is_active: true },
          select: {
            id: true,
            product_code: true,
            name: true,
            description: true,
            image_url: true,
            preview_images: true,
            production_days: true,
          },
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!group) throw new ApiError("Product group not found.", 404, "GROUP_NOT_FOUND");

    return {
      id: group.id,
      group_code: group.group_code,
      name: group.name,
      description: group.description,
      image_url: resolveCatalogImage(
        group.image_url,
        [
          group.category?.image_url,
          group.products
            .map((p) => resolveCatalogImage(p.image_url, p.preview_images))
            .find((value): value is string => Boolean(value)) ?? null,
        ]
      ),
      products: group.products.map((p) => ({
        id: p.id,
        product_code: p.product_code,
        name: p.name,
        description: p.description,
        image_url: resolveCatalogImage(p.image_url, p.preview_images),
        production_days: Number(p.production_days),
      })),
    };
  });
};

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export const listAllGroupsAdminService = async () => {
  const groups = await prisma.productGroup.findMany({
    select: {
      id: true,
      group_code: true,
      name: true,
      description: true,
      image_url: true,
      is_active: true,
      created_at: true,
      products: {
        where: { is_active: true },
        select: { id: true, name: true, product_code: true },
      },
    },
    orderBy: { created_at: "asc" },
  });
  return groups;
};

export const createGroupAdminService = async (input: {
  group_code: string;
  name: string;
  description?: string;
  image_url?: string;
  category_id?: string;
}) => {
  const group = await prisma.productGroup.create({
    data: {
      group_code: input.group_code,
      name: input.name,
      description: input.description ?? null,
      image_url: input.image_url ?? null,
      category_id: input.category_id ?? null,
    },
  });
  await invalidateCatalogGroupCache();
  return group;
};

export const updateGroupAdminService = async (
  groupId: string,
  input: Partial<{
    name: string;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
  }>
) => {
  const existing = await prisma.productGroup.findUnique({ where: { id: groupId } });
  if (!existing) throw new ApiError("Group not found.", 404, "GROUP_NOT_FOUND");

  const updated = await prisma.productGroup.update({ where: { id: groupId }, data: input });
  await invalidateCatalogGroupCache(groupId);
  return updated;
};

// Assigns or removes a product from a group
export const setProductGroupAdminService = async (
  productId: string,
  groupId: string | null
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError("Product not found.", 404, "PRODUCT_NOT_FOUND");

  if (groupId) {
    const group = await prisma.productGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new ApiError("Group not found.", 404, "GROUP_NOT_FOUND");
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { group_id: groupId },
    select: { id: true, name: true, product_code: true, group_id: true },
  });

  // Invalidate both old and new group cache
  await invalidateCatalogGroupCache(groupId ?? product.group_id ?? undefined);
  return updated;
};
