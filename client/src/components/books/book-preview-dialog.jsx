import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "@phosphor-icons/react"

function BookPreviewDialog({ open, onOpenChange, previewUrl, title }) {
  const handleClose = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[900px] [&>button]:hidden">
        {/* Header sits above the iframe so the Drive preview toolbar can
            never cover the close button. The default dialog X is hidden
            ([&>button]:hidden) because it renders over the iframe corner. */}
        <div className='flex items-center gap-3 border-b bg-card px-4 py-3'>
          <DialogTitle className='min-w-0 flex-1 truncate text-base'>
            {title || 'Preview'}
          </DialogTitle>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 shrink-0 border-0 shadow-none'
            onClick={handleClose}
            aria-label='Close preview'
            title='Close preview'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
        {previewUrl ? (
          <iframe
            src={previewUrl}
            title={`Preview of ${title}`}
            className="h-[70vh] w-full border-0 sm:h-[75vh]"
            allow="autoplay"
          ></iframe>
        ) : (
          <div className="flex h-[50vh] items-center justify-center p-6 text-center">
            <p>
              Unable to preview this file. The Google Drive link may be invalid or the file may not be supported for
              preview.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default BookPreviewDialog
