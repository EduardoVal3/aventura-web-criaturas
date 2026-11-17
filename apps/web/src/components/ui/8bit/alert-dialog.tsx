"use client";

import type * as React from "react";

import type * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import {
  AlertDialog as ShadcnAlertDialog,
  AlertDialogAction as ShadcnAlertDialogAction,
  AlertDialogCancel as ShadcnAlertDialogCancel,
  AlertDialogContent as ShadcnAlertDialogContent,
  AlertDialogDescription as ShadcnAlertDialogDescription,
  AlertDialogFooter as ShadcnAlertDialogFooter,
  AlertDialogHeader as ShadcnAlertDialogHeader,
  AlertDialogOverlay as ShadcnAlertDialogOverlay,
  AlertDialogPortal as ShadcnAlertDialogPortal,
  AlertDialogTitle as ShadcnAlertDialogTitle,
  AlertDialogTrigger as ShadcnAlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import "@/components/ui/8bit/styles/retro.css";

export const alertDialogVariants = cva("", {
  variants: {
    font: {
      normal: "",
      retro: "retro",
    },
  },
  defaultVariants: {
    font: "retro",
  },
});

export interface BitAlertDialogProps
  extends React.ComponentProps<typeof AlertDialogPrimitive.Root>,
    VariantProps<typeof alertDialogVariants> {}

function AlertDialog({ ...props }: BitAlertDialogProps) {
  return <ShadcnAlertDialog {...props} />;
}

function AlertDialogTrigger({
  className,
  asChild = true,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <ShadcnAlertDialogTrigger
      className={cn(className)}
      asChild={asChild}
      {...props}
    />
  );
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <ShadcnAlertDialogPortal {...props} />;
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return <ShadcnAlertDialogOverlay className={cn(className)} {...props} />;
}

interface BitAlertDialogContentProps
  extends React.ComponentProps<typeof AlertDialogPrimitive.Content>,
    VariantProps<typeof alertDialogVariants> {}

function AlertDialogContent({
  className,
  children,
  font,
  ...props
}: BitAlertDialogContentProps) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <ShadcnAlertDialogContent
        className={cn(
          "rounded-none",
          font !== "normal" && "retro",
          className
        )}
        {...props}
      >
        {children}
      </ShadcnAlertDialogContent>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <ShadcnAlertDialogHeader
      className={cn(
        "!flex !flex-col !w-full !text-left !items-stretch gap-3 !grid-cols-none",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <ShadcnAlertDialogFooter
      className={cn(
        "!flex !flex-col-reverse sm:!flex-row sm:!justify-end !gap-4 w-full !m-0 !p-0 !bg-transparent !border-0 pt-4 mt-2 border-t-2 border-black/60",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <ShadcnAlertDialogTitle className={cn(className)} {...props} />;
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return <ShadcnAlertDialogDescription className={cn(className)} {...props} />;
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <ShadcnAlertDialogAction
      className={cn(
        "rounded-none active:translate-y-1 transition-transform relative ring-0 border-none",
        className
      )}
      {...props}
    >
      {props.children}
    </ShadcnAlertDialogAction>
  );
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <ShadcnAlertDialogCancel
      className={cn(
        "rounded-none active:translate-y-1 transition-transform relative ring-0 border-none",
        className
      )}
      {...props}
    >
      {props.children}
    </ShadcnAlertDialogCancel>
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
