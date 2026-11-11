import { defineResource, head } from "../../core/resource";
import { domainTypeSchema } from "./domain-type.schema";

export const domainTypeResource = defineResource({
  name: "domain-types",
  title: "Domain Types",
  description:
    "Domain types such as Domains of Blessing, Forgery or Mastery, Trounce Domains, One-Time Domains and Quest Domains. Each type lists its domains.",
  example: "domains-of-forgery",
  schema: domainTypeSchema,
  refs: {},
  filters: {},
  sorts: {},
  summary: (t, ctx) => ({
    ...head("domain-types", t, ctx),
    category: t.category,
    icon: ctx.image(t.images.icon),
  }),
  detail: (t, ctx) => ({
    ...head("domain-types", t, ctx),
    category: t.category,
    description: t.description,
    images: ctx.images(t.images),
    domains: ctx.related<{ type: string }>("domains", (d) => d.type === t.slug),
  }),
});
