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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Form schema for validation
const priceFormSchema = z.object({
  price: z.coerce.number().positive({ message: "Price must be a positive number." })
});

type PriceFormValues = z.infer<typeof priceFormSchema>;

interface PriceAdjusterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

export default function PriceAdjuster({ open, onOpenChange, product }: PriceAdjusterProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const defaultValues: PriceFormValues = {
    price: product?.price ? parseFloat(product.price) : 0,
  };

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema),
    defaultValues,
  });

  async function onSubmit(data: PriceFormValues) {
    setIsSubmitting(true);
    try {
      await apiRequest("PATCH", `/api/products/${product.id}/price`, data);
      
      // Invalidate the products cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: "Price updated",
        description: `Product price updated to $${data.price.toFixed(2)}.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update price. Please try again.",
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
          <DialogTitle>Adjust Product Price</DialogTitle>
          <DialogDescription>
            Update the price for <strong>{product.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Price:</span>
                <span className="font-medium">${parseFloat(product.price).toFixed(2)}</span>
              </div>
              
              {product.optimalPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Optimal Price:</span>
                  <span className="font-medium text-green-600">${parseFloat(product.optimalPrice).toFixed(2)}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Price"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}