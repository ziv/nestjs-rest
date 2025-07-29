import { z, ZodType } from "zod";

export const jsonDocument = (data: ZodType) =>
  z.object({
    data,
  });

export const createDocument = jsonDocument(z.object({
  type: z.string(),
  attributes: z.record(z.string(), z.any()),
  relationships: z.object({}).optional(), // todo complete with relationships schema
}));

export const updateDocument = jsonDocument(z.object({
  type: z.string(),
  attributes: z.record(z.string(), z.any()),
  relationships: z.object({}).optional(), // todo complete with relationships schema
}));

export type CreateDocument = z.infer<typeof createDocument>;
export type UpdateDocument = z.infer<typeof updateDocument>;
