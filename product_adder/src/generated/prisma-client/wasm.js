
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AdminUserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  password: 'password',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RegistrationRequestScalarFieldEnum = {
  id: 'id',
  business_name: 'business_name',
  owner_name: 'owner_name',
  email: 'email',
  phone_number: 'phone_number',
  business_address: 'business_address',
  notes: 'notes',
  status: 'status',
  rejection_reason: 'rejection_reason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClientScalarFieldEnum = {
  id: 'id',
  client_code: 'client_code',
  phone_number: 'phone_number',
  password: 'password',
  business_name: 'business_name',
  owner_name: 'owner_name',
  email: 'email',
  address: 'address',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TemplateCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  createdAt: 'createdAt'
};

exports.Prisma.TemplateScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  categoryId: 'categoryId',
  fileUrl: 'fileUrl',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.DesignSubmissionScalarFieldEnum = {
  id: 'id',
  clientId: 'clientId',
  productId: 'productId',
  templateId: 'templateId',
  title: 'title',
  notes: 'notes',
  fileUrl: 'fileUrl',
  fileType: 'fileType',
  fileSize: 'fileSize',
  status: 'status',
  feedbackMessage: 'feedbackMessage',
  approvedDesignId: 'approvedDesignId',
  submittedAt: 'submittedAt',
  reviewedBy_id: 'reviewedBy_id',
  reviewedAt: 'reviewedAt'
};

exports.Prisma.ApprovedDesignScalarFieldEnum = {
  id: 'id',
  designCode: 'designCode',
  clientId: 'clientId',
  submissionId: 'submissionId',
  productId: 'productId',
  approvedFileUrl: 'approvedFileUrl',
  extraPrice: 'extraPrice',
  status: 'status',
  approvedBy_id: 'approvedBy_id',
  approvedAt: 'approvedAt',
  archivedBy_id: 'archivedBy_id',
  archivedAt: 'archivedAt',
  archiveReason: 'archiveReason'
};

exports.Prisma.ProductGroupScalarFieldEnum = {
  id: 'id',
  category_id: 'category_id',
  group_code: 'group_code',
  name: 'name',
  description: 'description',
  image_url: 'image_url',
  is_active: 'is_active',
  module: 'module',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ProductCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  image_url: 'image_url',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  category_id: 'category_id',
  group_id: 'group_id',
  product_code: 'product_code',
  name: 'name',
  description: 'description',
  image_url: 'image_url',
  preview_images: 'preview_images',
  production_days: 'production_days',
  is_active: 'is_active',
  module: 'module',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ProductVariantScalarFieldEnum = {
  id: 'id',
  product_id: 'product_id',
  variant_code: 'variant_code',
  variant_name: 'variant_name',
  min_quantity: 'min_quantity',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.OptionGroupScalarFieldEnum = {
  id: 'id',
  variant_id: 'variant_id',
  name: 'name',
  label: 'label',
  display_order: 'display_order',
  is_required: 'is_required',
  is_pricing_dimension: 'is_pricing_dimension',
  created_at: 'created_at'
};

exports.Prisma.OptionValueScalarFieldEnum = {
  id: 'id',
  group_id: 'group_id',
  code: 'code',
  label: 'label',
  display_order: 'display_order',
  is_active: 'is_active',
  image_url: 'image_url',
  created_at: 'created_at'
};

exports.Prisma.VariantPricingScalarFieldEnum = {
  id: 'id',
  variant_id: 'variant_id',
  combination_key: 'combination_key',
  selected_options: 'selected_options',
  price: 'price',
  discount_type: 'discount_type',
  discount_value: 'discount_value',
  is_active: 'is_active',
  created_at: 'created_at'
};

exports.Prisma.CouponScalarFieldEnum = {
  id: 'id',
  code: 'code',
  description: 'description',
  discount_type: 'discount_type',
  discount_value: 'discount_value',
  min_order_amount: 'min_order_amount',
  max_discount: 'max_discount',
  is_active: 'is_active',
  valid_from: 'valid_from',
  valid_until: 'valid_until',
  max_uses: 'max_uses',
  used_count: 'used_count',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  recipientRole: 'recipientRole',
  recipientId: 'recipientId',
  type: 'type',
  title: 'title',
  message: 'message',
  referenceId: 'referenceId',
  isRead: 'isRead',
  createdAt: 'createdAt',
  readAt: 'readAt',
  clientId: 'clientId'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  variant_id: 'variant_id',
  quantity: 'quantity',
  unit_price: 'unit_price',
  total_amount: 'total_amount',
  discount_type: 'discount_type',
  discount_value: 'discount_value',
  discount_amount: 'discount_amount',
  final_amount: 'final_amount',
  status: 'status',
  payment_status: 'payment_status',
  notes: 'notes',
  pricing_snapshot: 'pricing_snapshot',
  payment_proof_url: 'payment_proof_url',
  payment_proof_file_name: 'payment_proof_file_name',
  payment_proof_mime_type: 'payment_proof_mime_type',
  payment_proof_file_size: 'payment_proof_file_size',
  expected_delivery_date: 'expected_delivery_date',
  designId: 'designId',
  couponCodeId: 'couponCodeId',
  coupon_discount_amount: 'coupon_discount_amount',
  created_at: 'created_at',
  updated_at: 'updated_at',
  walletTransactionId: 'walletTransactionId',
  attachment_urls: 'attachment_urls'
};

exports.Prisma.OrderStatusHistoryScalarFieldEnum = {
  id: 'id',
  order_id: 'order_id',
  status: 'status',
  changed_at: 'changed_at',
  changed_by: 'changed_by'
};

exports.Prisma.OrderConfigurationScalarFieldEnum = {
  id: 'id',
  order_id: 'order_id',
  group_name: 'group_name',
  group_label: 'group_label',
  selected_code: 'selected_code',
  selected_label: 'selected_label',
  created_at: 'created_at'
};

exports.Prisma.CompanyPaymentDetailScalarFieldEnum = {
  id: 'id',
  companyName: 'companyName',
  bankName: 'bankName',
  accountName: 'accountName',
  accountNumber: 'accountNumber',
  branch: 'branch',
  paymentId: 'paymentId',
  qrImageUrl: 'qrImageUrl',
  note: 'note',
  isActive: 'isActive',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WalletAccountScalarFieldEnum = {
  id: 'id',
  clientId: 'clientId',
  currency: 'currency',
  availableBalance: 'availableBalance',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WalletTopupRequestScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  clientId: 'clientId',
  submittedAmount: 'submittedAmount',
  approvedAmount: 'approvedAmount',
  paymentMethod: 'paymentMethod',
  transferReference: 'transferReference',
  note: 'note',
  proofFilePath: 'proofFilePath',
  proofFileName: 'proofFileName',
  proofMimeType: 'proofMimeType',
  proofFileSize: 'proofFileSize',
  status: 'status',
  rejectionReason: 'rejectionReason',
  rejectionCode: 'rejectionCode',
  reviewedById: 'reviewedById',
  reviewedAt: 'reviewedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WalletTransactionScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  clientId: 'clientId',
  topupRequestId: 'topupRequestId',
  type: 'type',
  source: 'source',
  sourceId: 'sourceId',
  amount: 'amount',
  currency: 'currency',
  balanceBefore: 'balanceBefore',
  balanceAfter: 'balanceAfter',
  description: 'description',
  createdAt: 'createdAt'
};

exports.Prisma.PageViewScalarFieldEnum = {
  id: 'id',
  path: 'path',
  sessionId: 'sessionId',
  visitedAt: 'visitedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.RegistrationStatus = exports.$Enums.RegistrationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.DesignSubmissionStatus = exports.$Enums.DesignSubmissionStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.ApprovedDesignStatus = exports.$Enums.ApprovedDesignStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED'
};

exports.ProductModule = exports.$Enums.ProductModule = {
  PRINTING: 'PRINTING',
  MACHINERY: 'MACHINERY'
};

exports.NotificationRecipientRole = exports.$Enums.NotificationRecipientRole = {
  CLIENT: 'CLIENT',
  ADMIN: 'ADMIN'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  ORDER_PLACED: 'ORDER_PLACED',
  ORDER_PROCESSING: 'ORDER_PROCESSING',
  ORDER_PREPARED: 'ORDER_PREPARED',
  ORDER_DISPATCHED: 'ORDER_DISPATCHED',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  ORDER_CANCELLED: 'ORDER_CANCELLED'
};

exports.WalletTopupStatus = exports.$Enums.WalletTopupStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.WalletTxnType = exports.$Enums.WalletTxnType = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT'
};

exports.WalletTxnSource = exports.$Enums.WalletTxnSource = {
  TOPUP: 'TOPUP',
  ORDER: 'ORDER',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT'
};

exports.Prisma.ModelName = {
  AdminUser: 'AdminUser',
  RegistrationRequest: 'RegistrationRequest',
  Client: 'Client',
  TemplateCategory: 'TemplateCategory',
  Template: 'Template',
  DesignSubmission: 'DesignSubmission',
  ApprovedDesign: 'ApprovedDesign',
  ProductGroup: 'ProductGroup',
  ProductCategory: 'ProductCategory',
  Product: 'Product',
  ProductVariant: 'ProductVariant',
  OptionGroup: 'OptionGroup',
  OptionValue: 'OptionValue',
  VariantPricing: 'VariantPricing',
  Coupon: 'Coupon',
  Notification: 'Notification',
  Order: 'Order',
  OrderStatusHistory: 'OrderStatusHistory',
  OrderConfiguration: 'OrderConfiguration',
  CompanyPaymentDetail: 'CompanyPaymentDetail',
  WalletAccount: 'WalletAccount',
  WalletTopupRequest: 'WalletTopupRequest',
  WalletTransaction: 'WalletTransaction',
  PageView: 'PageView'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
