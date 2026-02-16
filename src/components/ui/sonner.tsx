import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1a1a1a] group-[.toaster]:text-white group-[.toaster]:border-gold-500/30 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-white/90",
          actionButton:
            "group-[.toast]:bg-gold-500 group-[.toast]:text-black",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white",
          success: "group-[.toast]:border-gold-500/30",
          error: "group-[.toast]:border-red-500/40 group-[.toast]:bg-[#1a1a1a]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
