import { pgTable, uuid, text, integer, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  googleLocationName: text("google_location_name").notNull(),
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull().default("other"),
  tone: text("tone").notNull().default("warm_casual"),
  gbpAccessToken: text("gbp_access_token"),
  gbpRefreshToken: text("gbp_refresh_token"),
  gbpTokenExpiresAt: timestamp("gbp_token_expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  googleReviewId: text("google_review_id").notNull(),
  reviewerName: text("reviewer_name"),
  starRating: integer("star_rating").notNull(),
  comment: text("comment"),
  reviewCreatedAt: timestamp("review_created_at").notNull(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueIndex: uniqueIndex("unique_google_review_business").on(table.googleReviewId, table.businessId),
}));

export const responses = pgTable("responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewId: uuid("review_id").references(() => reviews.id).notNull(),
  status: text("status").notNull().default("draft"),
  suggestedText: text("suggested_text"),
  finalText: text("final_text"),
  googleModerationState: text("google_moderation_state"),
  notifiedAt: timestamp("notified_at"),
  approvedAt: timestamp("approved_at"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const digestLogs = pgTable("digest_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  totalReviews: integer("total_reviews").default(0),
  positiveCount: integer("positive_count").default(0),
  negativeCount: integer("negative_count").default(0),
  pendingApproval: integer("pending_approval").default(0),
  avgRating: integer("avg_rating"),
});
