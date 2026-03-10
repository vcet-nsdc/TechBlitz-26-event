import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default: "border-zinc-700 bg-zinc-900 text-zinc-100",
      success: "border-emerald-500/40 bg-emerald-500/20 text-emerald-300",
      warning: "border-amber-500/40 bg-amber-500/20 text-amber-300",
      danger: "border-red-500/40 bg-red-500/20 text-red-300"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export function Badge({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
