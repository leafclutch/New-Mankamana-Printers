import prisma from "../../connect";

// getCategoriesService: Logic to fetch all template categories from the database
export const getCategoriesService = async () => {
  const categories = await prisma.templateCategory.findMany({
    orderBy: { name: "asc" }
  });
  return categories;
};

// getTemplatesService: Paginated retrieval of active design templates, optionally filtered by category
export const getTemplatesService = async (options: {
  category?: string;
  page: number;
  limit: number;
  search?: string;
}) => {
  const { category, page, limit, search } = options;

  const where: any = { isActive: true };

  if (category) {
    where.category = { slug: category };
  }

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  const [items, totalItems] = await Promise.all([
    prisma.template.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.template.count({ where })
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return { items, pagination: { page, limit, totalItems, totalPages } };
};

// getTemplateByIdService: Returns the full details of a single active template by ID
export const getTemplateByIdService = async (id: string) => {
  const template = await prisma.template.findFirst({
    where: { id, isActive: true },
    include: { category: { select: { id: true, name: true, slug: true } } }
  });
  return template;
};

// createCategoryService: Logic to persist a new category for templates in the database
export const createCategoryService = async (data: { name: string; slug: string }) => {
  return await prisma.templateCategory.create({
    data,
  });
};

// createTemplateService: Logic to add a new design template to the system catalog
export const createTemplateService = async (data: {
  title: string;
  description?: string;
  categoryId: string;
  fileUrl: string;
  isActive?: boolean;
}) => {
  return await prisma.template.create({
    data,
  });
};
