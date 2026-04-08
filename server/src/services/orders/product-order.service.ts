import prisma from "../../connect";
import { getVariantPricingCombination, calculateOrderAmount, normalizeSelectedOptions } from "../catalog/product-pricing.service";

// ORDER_PLACED → ORDER_PROCESSING → ORDER_PREPARED → ORDER_DISPATCHED → ORDER_DELIVERED
const ORDER_STATUS_FLOW: Record<string, string | null> = {
  ORDER_PLACED: "ORDER_PROCESSING",
  ORDER_PROCESSING: "ORDER_PREPARED",
  ORDER_PREPARED: "ORDER_DISPATCHED",
  ORDER_DISPATCHED: "ORDER_DELIVERED",
  ORDER_DELIVERED: null,
};

// createProductOrderService: Core logic for placing a new order, resolving pricing and saving configurations
export const createProductOrderService = async (data: {
  userId: string;
  variantId: string;
  quantity: number;
  options: Record<string, unknown> & {
    configDetails?: Array<{
      groupName: string;
      groupLabel: string;
      selectedCode: string;
      selectedLabel: string;
    }>;
  };
  notes?: string;
  designCode?: string;
  paymentProofUrl?: string;
  paymentProofFileName?: string;
  paymentProofMimeType?: string;
  paymentProofFileSize?: number;
}) => {
  const { userId, variantId, quantity, options, notes, designCode,
    paymentProofUrl, paymentProofFileName, paymentProofMimeType, paymentProofFileSize } = data;
  const selectedOptions = normalizeSelectedOptions(options);

  const pricingRow = await getVariantPricingCombination(variantId, selectedOptions);
  if (!pricingRow) {
    throw new Error("Invalid combination of options for this product variant.");
  }

  const unitPrice = Number(pricingRow.price);
  const pricingDiscount =
    pricingRow.discount_type && Number(pricingRow.discount_value) > 0
      ? {
          type: pricingRow.discount_type as "percentage" | "fixed",
          value: Number(pricingRow.discount_value),
        }
      : undefined;

  const { totalAmount, discountAmount, finalAmount } = calculateOrderAmount(
    unitPrice,
    quantity,
    pricingDiscount
  );

  const pricingSnapshot = {
    pricingRowId: pricingRow.id,
    pricing: selectedOptions,
    unit_price: unitPrice,
    base_total: totalAmount,
    discount: pricingDiscount
      ? {
          type: pricingDiscount.type,
          value: pricingDiscount.value,
          amount: discountAmount,
        }
      : null,
    final_total: finalAmount,
    designCode: designCode || null,
  };

  return await prisma.$transaction(async (tx) => {
    let approvedDesignId: string | null = null;

    if (designCode) {
      const approvedDesign = await tx.approvedDesign.findFirst({
        where: {
          designCode,
          clientId: userId,
          status: "ACTIVE",
        },
      });

      if (!approvedDesign) {
        throw new Error("Invalid design code. Please use an active approved design code belonging to your account.");
      }

      approvedDesignId = approvedDesign.id;
    }

    const order = await tx.order.create({
      data: {
        user_id: userId,
        variant_id: variantId,
        quantity: quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        discount_type: pricingDiscount?.type || null,
        discount_value: pricingDiscount?.value || 0,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        notes: notes,
        designId: approvedDesignId,
        pricing_snapshot: pricingSnapshot as any,
        status: "ORDER_PLACED",
        payment_status: paymentProofUrl ? "PROOF_SUBMITTED" : "PENDING",
        payment_proof_url: paymentProofUrl || null,
        payment_proof_file_name: paymentProofFileName || null,
        payment_proof_mime_type: paymentProofMimeType || null,
        payment_proof_file_size: paymentProofFileSize || null,
      },
    });

    if (options.configDetails && options.configDetails.length > 0) {
      await tx.orderConfiguration.createMany({
        data: options.configDetails.map((config) => ({
          order_id: order.id,
          group_name: config.groupName,
          group_label: config.groupLabel,
          selected_code: config.selectedCode,
          selected_label: config.selectedLabel,
        })),
      });
    }

    return order;
  });
};

// getOrderDetailsService: Retrieves full details of a specific order including variant and config info
export const getOrderDetailsService = async (orderId: string) => {
  return await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      approvedDesign: {
        select: {
          id: true,
          designCode: true,
          status: true,
        },
      },
      variant: {
        include: {
          product: true,
        },
      },
      configurations: true,
    },
  });
};

// getClientOrdersService: Lists all orders placed by a specific client
export const getClientOrdersService = async (userId: string) => {
  return await prisma.order.findMany({
    where: { user_id: userId },
    include: {
      approvedDesign: {
        select: {
          designCode: true,
        },
      },
      variant: {
        select: {
          variant_name: true,
          product: { select: { name: true } }
        }
      }
    },
    orderBy: { created_at: "desc" },
  });
};

// getAllOrdersService: Provides an administrative overview of every order in the system
export const getAllOrdersService = async () => {
  return await prisma.order.findMany({
    include: {
      client: { select: { business_name: true, phone_number: true } },
      approvedDesign: {
        select: {
          designCode: true,
        },
      },
      variant: {
        select: {
          variant_name: true,
          product: { select: { name: true } }
        }
      }
    },
    orderBy: { created_at: "desc" },
  });
};

// updateOrderStatusService: Logic to transition an order status through the defined processing states
export const updateOrderStatusService = async (orderId: string, status: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const allowedTargetStatuses = Object.values(ORDER_STATUS_FLOW).filter(Boolean);
  if (!allowedTargetStatuses.includes(status)) {
    throw new Error("Unsupported order status");
  }

  if (order.status === status) {
    return order;
  }

  const allowedNextStatus = ORDER_STATUS_FLOW[order.status];
  if (allowedNextStatus !== status) {
    throw new Error(
      `Invalid status transition. Current status is ${order.status}. Allowed next status is ${allowedNextStatus ?? "none (order is complete)"}.`
    );
  }

  return await prisma.order.update({
    where: { id: orderId },
    data: { status: status as any, updated_at: new Date() },
  });
};
