import prisma from "../../connect";
import { ApiError } from "../../utils/api-error";
import { withCache, invalidateCacheKey } from "../../utils/cache";
import { getPublicUrlForPath } from "../../utils/file-upload";

const MACHINERY_BROWSE_TTL_MS = 60_000;
const MACHINERY_GROUP_DETAIL_TTL_MS = 60_000;

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

export const listMachineryCatalogService = async () => {
  return withCache("machinery:browse", MACHINERY_BROWSE_TTL_MS, async () => {
    const [groups, standaloneProducts] = await Promise.all([
      prisma.productGroup.findMany({
        where: { is_active: true, module: "MACHINERY" },
        select: {
          id: true,
          group_code: true,
          name: true,
          description: true,
          image_url: true,
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
        where: { is_active: true, group_id: null, module: "MACHINERY" },
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
            .find((v): v is string => Boolean(v)) ?? null;

        return {
          id: g.id,
          group_code: g.group_code,
          name: g.name,
          description: g.description,
          image_url: resolveCatalogImage(g.image_url, [firstProductImage]),
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

export const getMachineryGroupService = async (groupId: string) => {
  return withCache(`machinery:group:${groupId}`, MACHINERY_GROUP_DETAIL_TTL_MS, async () => {
    const group = await prisma.productGroup.findFirst({
      where: { id: groupId, is_active: true, module: "MACHINERY" },
      select: {
        id: true,
        group_code: true,
        name: true,
        description: true,
        image_url: true,
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

    if (!group) throw new ApiError("Machinery group not found.", 404, "GROUP_NOT_FOUND");

    return {
      id: group.id,
      group_code: group.group_code,
      name: group.name,
      description: group.description,
      image_url: resolveCatalogImage(
        group.image_url,
        [
          group.products
            .map((p) => resolveCatalogImage(p.image_url, p.preview_images))
            .find((v): v is string => Boolean(v)) ?? null,
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

export const invalidateMachineryCacheForGroup = async (groupId?: string | null) => {
  await invalidateCacheKey("machinery:browse");
  if (groupId) await invalidateCacheKey(`machinery:group:${groupId}`);
};

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export const listMachineryGroupsAdminService = async () => {
  return prisma.productGroup.findMany({
    where: { module: "MACHINERY" },
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
};

export const createMachineryGroupService = async (input: {
  group_code: string;
  name: string;
  description?: string;
}) => {
  const group = await prisma.productGroup.create({
    data: {
      group_code: input.group_code,
      name: input.name,
      description: input.description ?? null,
      module: "MACHINERY",
    },
  });
  await invalidateCacheKey("machinery:browse");
  return group;
};

export const updateMachineryGroupService = async (
  groupId: string,
  input: Partial<{ name: string; description: string | null; image_url: string | null; is_active: boolean }>
) => {
  const existing = await prisma.productGroup.findFirst({ where: { id: groupId, module: "MACHINERY" } });
  if (!existing) throw new ApiError("Machinery group not found.", 404, "GROUP_NOT_FOUND");

  const updated = await prisma.productGroup.update({ where: { id: groupId }, data: input });
  await invalidateMachineryCacheForGroup(groupId);
  return updated;
};

export const listMachineryProductsAdminService = async () => {
  const products = await prisma.product.findMany({
    where: { is_active: true, module: "MACHINERY" },
    include: {
      variants: {
        take: 1,
        include: {
          option_groups: {
            include: { values: { orderBy: { display_order: "asc" } } },
            orderBy: { display_order: "asc" },
          },
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  return products.map((p) => {
    const variant = p.variants[0];
    return {
      id: p.id,
      product_code: p.product_code,
      name: p.name,
      description: p.description,
      image_url: resolveCatalogImage(p.image_url),
      is_active: p.is_active,
      group_id: p.group_id,
      production_days: Number(p.production_days),
      created_at: p.created_at,
      fields: variant
        ? variant.option_groups.map((g) => ({
            id: g.id,
            field_key: g.name,
            label: g.label,
            type: "select",
            is_required: g.is_required,
            is_pricing_field: g.is_pricing_dimension,
            display_order: g.display_order,
            options: g.values.map((v) => ({
              id: v.id,
              value: v.code,
              label: v.label,
              display_order: v.display_order,
            })),
          }))
        : [],
    };
  });
};

export const createMachineryProductService = async (groupId: string, input: {
  product_code: string;
  name: string;
  description?: string;
}) => {
  const group = await prisma.productGroup.findFirst({ where: { id: groupId, module: "MACHINERY" } });
  if (!group) throw new ApiError("Machinery group not found.", 404, "GROUP_NOT_FOUND");

  const product = await prisma.product.create({
    data: {
      product_code: input.product_code,
      name: input.name,
      description: input.description ?? null,
      group_id: groupId,
      module: "MACHINERY",
      variants: {
        create: [{
          variant_code: `${input.product_code}-V1`,
          variant_name: "Standard",
          min_quantity: 1,
        }],
      },
    },
    include: { variants: true },
  });

  await invalidateMachineryCacheForGroup(groupId);
  return product;
};
