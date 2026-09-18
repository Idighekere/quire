import { useState, lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { extractDriveFileId, formatFileSize } from '@/helpers'
import { displayCourseCode } from '@/helpers/material-input'
import { DownloadSimple as Download, Eye } from '@phosphor-icons/react'
import ShareButton from '../share-button'

const BookPreviewDialog = lazy(() => import('./book-preview-dialog'))

const BookCard = ({ book }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Guard against undefined book
  if (!book) return null

  const driveFileId = book.driveFileId || extractDriveFileId(book.driveUrl)
  const courseCode = displayCourseCode(book.course) || 'N/A'
  // The public listing returns course as an array (aggregate $lookup);
  // the badge helper tolerates that, so the share path must too.
  const courseEntry = Array.isArray(book.course) ? book.course[0] : book.course
  const courseCodeValue = courseEntry?.courseCode || ''
  const courseSharePath = courseCodeValue
    ? `/books?courseCode=${courseCodeValue}&category=all&page=1`
    : '/books'

  const previewUrl = driveFileId
    ? `https://drive.google.com/file/d/${driveFileId}/preview`
    : ''

  const downloadLink = driveFileId
    ? `https://drive.usercontent.google.com/download?id=${driveFileId}&export=download&authuser=0&confirm=f`
    : ''

  const handlePreview = () => {
    setIsPreviewOpen(true)
  }

  const handleDownload = async (e) => {
    e.preventDefault()
    const link = document.createElement('a')
    link.href = downloadLink
    link.setAttribute('download', `${book.title}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className='relative flex h-full flex-col overflow-hidden rounded-md border bg-card shadow-card transition-shadow duration-150 ease-nuesa hover:shadow-soft-lift'>
      <div className='absolute right-2 top-2'>
        <ShareButton
          iconOnly
          variant='ghost'
          className='h-11 w-11 border-0 p-0 shadow-none'
          path={courseSharePath}
          title={`${book.title} (${courseCode}) — study materials on Quire`}
          label='Share this material'
        />
      </div>
      <div className='flex flex-1 flex-col p-5'>
        {/* Book Cover and Info */}
        <div className='mb-5 flex gap-4'>
          {/* Book Cover */}
          <div className='h-28 w-20 flex-shrink-0 overflow-hidden rounded-sm border bg-background p-1.5'>
            <img
              src={book.thumbnail || '/pdf.svg'}
              alt={`Cover of ${book.title}`}
              width="80"
              height="112"
              loading="lazy"
              decoding="async"
              className='h-full w-full object-cover'
            />
          </div>

          {/* Book Info */}
          <div className='flex flex-1 flex-col'>
            <div className='flex items-start justify-between gap-2 pr-8'>
              <Badge variant='secondary'>
                {courseCode}
              </Badge>
              <span className='font-mono text-[0.6875rem] uppercase tracking-[0.09em] text-muted-foreground'>
                {formatFileSize(book.size)}
              </span>
            </div>
            <h3 className='mt-3 line-clamp-2 text-lg font-semibold leading-snug tracking-tight'>
              {book.title}
            </h3>
            <div className='mt-auto pt-1 font-mono text-[0.6875rem] uppercase tracking-[0.09em] text-muted-foreground'>
              {book.category?.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='mt-auto flex w-full flex-col gap-2 sm:flex-row'>
          <Button
            variant='outline'
            className='w-full sm:flex-1'
            onClick={() => handlePreview()}
          >
            <Eye className='h-4 w-4' />
            Preview
          </Button>
          <form onSubmit={handleDownload} className='w-full sm:flex-1'>
            <Button className='w-full' type='submit'>
              <Download className='h-4 w-4' />
              Download
            </Button>
          </form>
        </div>
      </div>

      {/* Preview Dialog — lazy so radix-dialog only loads on demand */}
      {isPreviewOpen && (
        <Suspense fallback={null}>
          <BookPreviewDialog
            open={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            previewUrl={previewUrl}
            title={book.title}
          />
        </Suspense>
      )}
    </div>
  )
}

export default BookCard