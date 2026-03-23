import { z } from "zod";
import { createStructuredOutputSchema } from "../../../schemas/helper.js";

export const outputSchema = createStructuredOutputSchema({
  id: z.string().describe("Unique identifier for the created message thread"),
  subject: z.string().describe("Subject of the message"),
  status: z.string().describe("Delivery status (sent)"),
});
