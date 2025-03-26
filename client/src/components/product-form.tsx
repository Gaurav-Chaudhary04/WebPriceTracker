import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Form schema for validation
const productFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  sku: z.string().min(2, { message: "SKU must be at least 2 characters." }),
  category: z.string().min(1, { message: "Category is required." }),
  price: z.coerce.number().positive({ message: "Price must be a positive number." })
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  product?: Product; // Undefined for new product, defined for edit
}

export default function ProductForm({ open, onOpenChange, onSuccess, product }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!product;

  // Set default values based on product (if editing) or empty values (if creating)
  const defaultValues: Partial<ProductFormValues> = {
    name: product?.name || "",
    sku: product?.sku || "",
    category: product?.category || "",
    price: product?.price ? parseFloat(product.price) : undefined,
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true);
    try {
      if (isEditing && product) {
        // Update existing product
        await apiRequest("PUT", `/api/products/${product.id}`, data);
        toast({
          title: "Product updated",
          description: "Product has been updated successfully.",
          variant: "default",
        });
      } else {
        // Create new product
        await apiRequest("POST", "/api/products", data);
        toast({
          title: "Product added",
          description: "New product has been added successfully.",
          variant: "default",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Make changes to the product details below."
              : "Enter the details for the new product."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="SKU123" {...field} disabled={isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : isEditing ? (
                  "Save Changes"
                ) : (
                  "Add Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}