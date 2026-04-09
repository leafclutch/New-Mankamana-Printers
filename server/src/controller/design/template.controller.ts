import { Request, Response } from "express";
import { getCategoriesService, getTemplatesService, getTemplateByIdService, createCategoryService, createTemplateService } from "../../services/design/template.service";
import { getTemplatesQuerySchema, createTemplateCategorySchema, createTemplateSchema } from "../../validators/template.validator";
import { uploadToSupabase } from "../../utils/file-upload";
import prisma from "../../connect";

// getTemplateCategories: Fetches all available categories for design templates
export const getTemplateCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getCategoriesService();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// getTemplates: Retrieves a paginated list of templates, optionally filtered by category or search term
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const validatedQuery = getTemplatesQuerySchema.safeParse(req.query);
    if (!validatedQuery.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validatedQuery.error.issues,
      });
    }

    const { category, page, limit, search } = validatedQuery.data;

    const data = await getTemplatesService({
      category,
      page: page || 1,
      limit: limit || 10,
      search,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// getTemplateById: Returns the full details of a specific design template
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const templateId = req.params.templateId as string;
    const template = await getTemplateByIdService(templateId);

    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found or inactive" });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error fetching template by ID:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// createTemplateCategory: Admin-only function to add a new category for templates
export const createTemplateCategory = async (req: Request, res: Response) => {
  try {
    const validatedData = createTemplateCategorySchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validatedData.error.issues });
    }

    const category = await createCategoryService(validatedData.data);
    res.status(201).json({
      success: true,
      message: "Template category created successfully",
      data: category,
    });
  } catch (error: any) {
    console.error("Error creating category:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: "Category with this slug already exists" });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// createTemplate: Admin-only function to upload and create a new design template
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const body = { ...req.body };
    
    // Resolve folder: templates/{category-slug} for organised storage
    if (file) {
      try {
        let folder = "templates/general";
        const categoryId = req.body.categoryId;
        if (categoryId) {
          const cat = await prisma.templateCategory.findUnique({ where: { id: categoryId } });
          if (cat?.slug) folder = `templates/${cat.slug}`;
        }
        body.fileUrl = await uploadToSupabase(file, folder);
      } catch (uploadError: any) {
        return res.status(500).json({ success: false, message: "File upload failed", error: uploadError.message });
      }
    }

    const validatedData = createTemplateSchema.safeParse(body);
    if (!validatedData.success) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validatedData.error.issues });
    }

    if (!validatedData.data.fileUrl) {
      return res.status(400).json({ success: false, message: "File or fileUrl is required" });
    }

    const template = await createTemplateService({
      title: validatedData.data.title,
      description: validatedData.data.description,
      categoryId: validatedData.data.categoryId,
      fileUrl: validatedData.data.fileUrl,
      isActive: validatedData.data.isActive,
    });

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
