"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Sparkles } from "lucide-react";
import {
  upsertProduct,
  previewSeoDescription,
  type ProductInput,
} from "@/lib/admin-mutations-client";
import type { Product, Category, Brand } from "@/lib/data";
import { AdminImageUploader } from "@/components/AdminImageUploader";
import { Field, Input, Textarea, Select, Checkbox } from "@/components/AdminFormControls";
import { centsToInput, dollarsToCents } from "@/lib/money";

interface Props {
  categories: Category[];
  brands: Brand[];
  product?: Product;
}

type FormShape = {
  name: string;
  category: string;
  brandId: string;
  price: string;
  salePrice: string;
  description: string;
  imageType: string;
  imageUrl: string;
  material: string;
  chipType: string;
  dimensions: string;
  mountType: string;
  weight: string;
  sku: string;
  quantity: string;
  lowStockThreshold: string;
  featured: boolean;
  inStock: boolean;
};

function strList(s: string): string {
  // Convert "Relaxing, Happy, Hungry" → JSON array string for storage
  const arr = s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return JSON.stringify(arr);
}

function fromList(s: string | null | undefined): string {
  if (!s) return "";
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.join(", ") : "";
  } catch {
    return "";
  }
}

export function ProductForm({ categories, brands, product }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormShape>({
    defaultValues: {
      name: product?.name ?? "",
      category: product?.category ?? categories[0]?.name ?? "Flower",
      brandId: product?.brandId?.toString() ?? "",
      material: product?.material ?? "",
      chipType: product?.chipType ?? "",
      dimensions: product?.dimensions ?? "",
      mountType: product?.mountType ?? "",
      price: centsToInput(product?.price) ?? "",
      salePrice: centsToInput(product?.salePrice) ?? "",
      description: product?.description ?? "",
      imageType: product?.imageType ?? "flower",
      imageUrl: product?.imageUrl ?? "",
      weight: product?.weight ?? "",
      sku: product?.sku ?? "",
      quantity: product?.quantity?.toString() ?? "",
      lowStockThreshold: product?.lowStockThreshold?.toString() ?? "5",
      featured: product?.featured ?? false,
      inStock: product?.inStock ?? true,
    },
  });

  const onSubmit = (values: FormShape) => {
    setError(null);
    const input: ProductInput = {
      ...(product?.id ? { id: product.id } : {}),
      name: values.name.trim(),
      category: values.category,
      brandId: values.brandId ? parseInt(values.brandId, 10) : null,
      material: values.material.trim(),
      chipType: values.chipType.trim(),
      dimensions: values.dimensions.trim(),
      mountType: values.mountType.trim(),
      price: dollarsToCents(values.price),
      salePrice: values.salePrice ? dollarsToCents(values.salePrice) : null,
      description: values.description.trim(),
      imageType: values.imageType || "flower",
      imageUrl: imageUrl || null,
      weight: values.weight,
      sku: values.sku || null,
      quantity: values.quantity ? parseInt(values.quantity, 10) : null,
      lowStockThreshold: values.lowStockThreshold
        ? parseInt(values.lowStockThreshold, 10)
        : 5,
      featured: !!values.featured,
      inStock: !!values.inStock,
    };
    startTransition(async () => {
      try {
        await upsertProduct(input);
        router.push("/admin/products");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  const [generating, setGenerating] = useState(false);
  const handleGenerateDescription = async () => {
    const v = getValues();
    if (!v.name.trim()) {
      setError("Enter a name first");
      return;
    }
    const brandName =
      v.brandId
        ? brands.find((b) => b.id === parseInt(v.brandId, 10))?.name
        : undefined;
    setGenerating(true);
    try {
      const text = await previewSeoDescription({
        name: v.name,
        category: v.category,
        brand: brandName,
      });
      setValue("description", text, { shouldDirty: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-300 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Basics</h2>
        <Field label="Name" error={errors.name?.message}>
          <Input {...register("name", { required: "Name is required" })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select {...register("category")}>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
              {categories.length === 0 && <option value="Flower">Flower</option>}
            </Select>
          </Field>
          <Field label="Brand (optional)">
            <Select {...register("brandId")}>
              <option value="">— none —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Description">
          <div>
            <Textarea rows={4} {...register("description", { required: true })} />
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={generating}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-zinc-700 hover:border-amber-600 hover:bg-amber-950/20 text-zinc-300 hover:text-amber-400 rounded-lg transition-colors disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              Generate from product details
            </button>
          </div>
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Pricing & Stock</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price ($)" error={errors.price?.message}>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="39.99"
              {...register("price", {
                required: "Required",
                valueAsNumber: false,
              })}
            />
          </Field>
          <Field label="Sale price ($, optional)">
            <Input type="number" min={0} step="0.01" placeholder="34.99" {...register("salePrice")} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Stock quantity">
            <Input type="number" min={0} {...register("quantity")} />
          </Field>
          <Field label="Low stock threshold">
            <Input type="number" min={0} {...register("lowStockThreshold")} />
          </Field>
          <Field label="SKU">
            <Input {...register("sku")} />
          </Field>
        </div>
        <div className="flex items-center gap-6">
          <Checkbox label="In stock" {...register("inStock")} />
          <Checkbox label="Featured" {...register("featured")} />
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Specs</h2>
        <p className="text-xs text-zinc-500">
          Shown on the product page. Leave blank to hide a row.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Material">
            <Input {...register("material")} placeholder="Brushed aluminium" />
          </Field>
          <Field label="NFC chip">
            <Input {...register("chipType")} placeholder="NTAG215" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dimensions">
            <Input {...register("dimensions")} placeholder="85 x 55 x 12 mm" />
          </Field>
          <Field label="Mounting">
            <Input {...register("mountType")} placeholder="Countertop stand" />
          </Field>
        </div>
        <Field label="Weight">
          <Input {...register("weight")} placeholder="120 g" />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Image</h2>
        <input type="hidden" {...register("imageType")} />
        <Field
          label="Product image"
          hint="Leave blank to show the product brand logo. Upload a product photo later to override it."
        >
          <AdminImageUploader value={imageUrl} onChange={setImageUrl} />
        </Field>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {product ? "Save changes" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-zinc-700 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
