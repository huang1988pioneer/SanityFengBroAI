import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { assetRefToUrl, flattenSanityDoc, flattenSanityValue } from "./sanityValues.ts";

const context = { projectId: "abc12345", dataset: "production" };

Deno.test("assetRefToUrl builds an image CDN url", () => {
  assertEquals(
    assetRefToUrl("image-3a5f9c1e2b4d6f8a0c2e4f6a8b0d2e4f6a8b0d2e-1200x800-png", context),
    "https://cdn.sanity.io/images/abc12345/production/3a5f9c1e2b4d6f8a0c2e4f6a8b0d2e4f6a8b0d2e-1200x800.png",
  );
});

Deno.test("assetRefToUrl builds a file CDN url", () => {
  assertEquals(
    assetRefToUrl("file-9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c-pdf", context),
    "https://cdn.sanity.io/files/abc12345/production/9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c.pdf",
  );
});

Deno.test("assetRefToUrl gives up quietly on refs and configs it cannot use", () => {
  assertEquals(assetRefToUrl("drafts.abc", context), "");
  assertEquals(assetRefToUrl("", context), "");
  assertEquals(assetRefToUrl("file-aaaa-pdf", { projectId: "", dataset: "production" }), "");
});

Deno.test("flattenSanityValue keeps scalars untouched", () => {
  assertEquals(flattenSanityValue("hi", context), "hi");
  assertEquals(flattenSanityValue(42, context), 42);
  assertEquals(flattenSanityValue(false, context), false);
  assertEquals(flattenSanityValue(null, context), "");
  assertEquals(flattenSanityValue(undefined, context), "");
});

Deno.test("a Studio image field becomes a url instead of [object Object]", () => {
  const photo = {
    _type: "image",
    asset: { _type: "reference", _ref: "image-1111111111111111111111111111111111111111-640x480-jpg" },
  };
  assertEquals(
    flattenSanityValue(photo, context),
    "https://cdn.sanity.io/images/abc12345/production/1111111111111111111111111111111111111111-640x480.jpg",
  );
});

Deno.test("an expanded asset url wins over rebuilding one from the ref", () => {
  const image = { _type: "image", asset: { url: "https://cdn.sanity.io/images/x/y/z-10x10.png" } };
  assertEquals(flattenSanityValue(image, context), "https://cdn.sanity.io/images/x/y/z-10x10.png");
});

Deno.test("portable text blocks flatten into plain lines", () => {
  const body = [
    { _type: "block", children: [{ text: "第一行" }] },
    { _type: "block", children: [{ text: "第二" }, { text: "行" }] },
  ];
  assertEquals(flattenSanityValue(body, context), "第一行\n第二行");
});

Deno.test("slug objects unwrap to their current value", () => {
  assertEquals(flattenSanityValue({ _type: "slug", current: "fengbro" }, context), "fengbro");
});

Deno.test("an unrecognised object falls back to JSON, never [object Object]", () => {
  assertEquals(flattenSanityValue({ a: 1 }, context), '{"a":1}');
});

Deno.test("flattenSanityDoc leaves system fields alone and flattens the rest", () => {
  const doc = {
    _id: "food-1",
    _type: "food",
    name: "八寶粥",
    photo: { _type: "image", asset: { _ref: "image-2222222222222222222222222222222222222222-100x100-webp" } },
  };
  const flat = flattenSanityDoc(doc, context);
  assertEquals(flat._id, "food-1");
  assertEquals(flat._type, "food");
  assertEquals(flat.name, "八寶粥");
  assertEquals(
    flat.photo,
    "https://cdn.sanity.io/images/abc12345/production/2222222222222222222222222222222222222222-100x100.webp",
  );
});
