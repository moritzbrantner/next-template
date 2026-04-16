CREATE TABLE "DirectMessageConversation" (
	"id" text PRIMARY KEY NOT NULL,
	"participantOneId" text NOT NULL,
	"participantTwoId" text NOT NULL,
	"lastMessageAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DirectMessage" (
	"id" text PRIMARY KEY NOT NULL,
	"conversationId" text NOT NULL,
	"senderId" text NOT NULL,
	"recipientId" text NOT NULL,
	"body" text NOT NULL,
	"readAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "DirectMessageConversation" ADD CONSTRAINT "DirectMessageConversation_participantOneId_User_id_fk" FOREIGN KEY ("participantOneId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DirectMessageConversation" ADD CONSTRAINT "DirectMessageConversation_participantTwoId_User_id_fk" FOREIGN KEY ("participantTwoId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_conversationId_DirectMessageConversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."DirectMessageConversation"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_User_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_recipientId_User_id_fk" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "DirectMessageConversation_participantPair_key" ON "DirectMessageConversation" USING btree ("participantOneId","participantTwoId");--> statement-breakpoint
CREATE INDEX "DirectMessageConversation_participantOneId_lastMessageAt_idx" ON "DirectMessageConversation" USING btree ("participantOneId","lastMessageAt");--> statement-breakpoint
CREATE INDEX "DirectMessageConversation_participantTwoId_lastMessageAt_idx" ON "DirectMessageConversation" USING btree ("participantTwoId","lastMessageAt");--> statement-breakpoint
CREATE INDEX "DirectMessage_conversationId_createdAt_idx" ON "DirectMessage" USING btree ("conversationId","createdAt");--> statement-breakpoint
CREATE INDEX "DirectMessage_recipientId_readAt_createdAt_idx" ON "DirectMessage" USING btree ("recipientId","readAt","createdAt");--> statement-breakpoint
CREATE INDEX "DirectMessage_senderId_createdAt_idx" ON "DirectMessage" USING btree ("senderId","createdAt");