import { Link, NavLink } from 'react-router-dom'
import { Book, BookOpen, House as Home, ShieldCheck } from '@phosphor-icons/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { QuireMark } from '@/components/brand/quire-logo'
import { BRAND_NAME } from '@/constants/branding'

function DashboardSidebar ({ user, open, onClose }) {
  const isAdmin = user.role === 'admin'

  const navItems = [
    {
      title: 'Home',
      href: '/dashboard',
      icon: Home
    },
    {
      title: 'Books',
      href: '/dashboard/books',
      icon: Book
    },
    {
      title: 'Courses',
      href: '/dashboard/courses',
      icon: BookOpen,
      adminOnly: true
    },
    {
      title: 'Moderation',
      href: '/dashboard/moderation',
      icon: ShieldCheck,
      adminOnly: true
    }
  ]

  // Filter items based on user role
  const filteredNavItems = navItems.filter(
    item => !item.adminOnly || (item.adminOnly && isAdmin)
  )

  const SidebarContent = () => (
    <>
      <div className='flex h-16 items-center gap-2 border-b px-4'>
        <Link to='/' className='flex items-center gap-2 transition-opacity hover:opacity-80'>
          <QuireMark size={28} />
          <div className='flex flex-col leading-none'>
            <span className='text-sm font-bold tracking-tight'>{BRAND_NAME}</span>
            <span className='font-mono text-[0.6rem] font-medium uppercase tracking-[0.08em] text-muted-foreground'>Dashboard</span>
          </div>
        </Link>
      </div>
      <ScrollArea className='flex-1 px-3'>
        <nav className='grid gap-1 py-4'>
          {filteredNavItems.map(item => (
            <NavLink
              key={item.title}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors duration-150 ease-nuesa hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground'
                )
              }
              onClick={() => onClose()}
            >
              {item.icon ? (
                <item.icon weight='bold' className='h-4 w-4' />
              ) : (
                <span className='inline-block h-4 w-4' aria-hidden='true'></span>
              )}
              {item.title}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </>
  )

  return (
    <>
      {/* Mobile sidebar (Sheet) — close handled by header hamburger, so hide Sheet's own X */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side='left' className='w-[300px] p-0 sm:w-[320px] [&>button]:hidden'>
          <div className='flex h-full flex-col'>
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className='hidden h-full w-[240px] flex-col border-r bg-card md:flex'>
        <SidebarContent />
      </div>
    </>
  )
}

export default DashboardSidebar