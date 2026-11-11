import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";
import { createInquiryPostHandler } from "@/lib/customer-inquiries";

export const POST = createInquiryPostHandler({
  store: prisma,
  getCustomer: getCustomerUser,
});
