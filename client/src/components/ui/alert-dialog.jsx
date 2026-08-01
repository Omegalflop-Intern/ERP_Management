import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as React from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

function AlertDialogOverlay({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
}
function AlertDialogContent({ className, ...props }) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={cn(
          'bg-background fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-lg',
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}
function AlertDialogHeader({ className, ...props }) {
  return (
    <div className={cn('flex flex-col gap-2 text-center sm:text-left', className)} {...props} />
  );
}
function AlertDialogFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}
function AlertDialogTitle({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Title className={cn('text-lg font-semibold', className)} {...props} />
  );
}
function AlertDialogDescription({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}
function AlertDialogAction({ className, ...props }) {
  return <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...props} />;
}
function AlertDialogCancel({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: 'outline' }), className)}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
