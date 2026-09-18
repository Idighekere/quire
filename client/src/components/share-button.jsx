import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Link as LinkIcon,
  ShareFat as ShareIcon,
  ShareNetwork as NativeShareIcon,
  WhatsappLogo,
} from '@phosphor-icons/react'
import { SITE_URL } from '@/constants/branding'
import toast from 'react-hot-toast'

/**
 * ShareButton — WhatsApp-first sharing for any shareable page.
 * path: relative app path (e.g. "/books?courseCode=GET211"). When omitted,
 * the current page URL is shared. title: message text sent with the link.
 */
const ShareButton = ({
  path,
  title = 'Study materials on Quire',
  variant = 'outline',
  size = 'sm',
  iconOnly = false,
  className = '',
  label = 'Share',
}) => {
  const [copied, setCopied] = useState(false)

  const relativePath =
    path || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')
  const absoluteUrl = `${SITE_URL}${relativePath}`
  const message = `${title}\n${absoluteUrl}`

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl)
    } catch {
      const input = document.createElement('textarea')
      input.value = absoluteUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    toast.success('Link copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: title, url: absoluteUrl })
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  }

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={iconOnly ? 'icon' : size}
          className={className}
          aria-label={label}
          title={label}
          style={{ minHeight: iconOnly ? 44 : undefined, minWidth: iconOnly ? 44 : undefined }}
        >
          <ShareIcon className='h-4 w-4' />
          {!iconOnly && label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={handleWhatsApp} className='flex cursor-pointer items-center gap-2'>
          <WhatsappLogo className='h-4 w-4' />
          Share on WhatsApp
        </DropdownMenuItem>
        {canNativeShare && (
          <DropdownMenuItem onClick={handleNativeShare} className='flex cursor-pointer items-center gap-2'>
            <NativeShareIcon className='h-4 w-4' />
            More options
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopy} className='flex cursor-pointer items-center gap-2'>
          <LinkIcon className='h-4 w-4' />
          {copied ? 'Copied' : 'Copy link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ShareButton
