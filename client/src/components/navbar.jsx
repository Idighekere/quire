import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CaretDown as ChevronDown, BookOpen, SignOut } from '@phosphor-icons/react'
import toast from 'react-hot-toast'

import { useAuth } from '@/contexts'
import { authApi } from '@/services'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { BRAND_NAME } from '@/constants/branding'
import { QuireMark } from '@/components/brand/quire-logo'

const navItems = [
  { title: 'Home', href: '/' },
  {
    title: 'Departments',
    href: '/departments',
    children: [
      {
        title: 'Agricultural Engineering',
        href: '/departments/agricultural-engineering',
        description: 'Applies engineering principles to agricultural production, processing, and sustainability challenges.'
      },
      {
        title: 'Chemical Engineering',
        href: '/departments/chemical-engineering',
        description: 'Focuses on designing and developing chemical processes and equipment to transform raw materials into valuable products.'
      },
      {
        title: 'Civil Engineering',
        href: '/departments/civil-engineering',
        description: 'Deals with the design, construction, and maintenance of the physical and naturally built environment.'
      },
      {
        title: 'Computer Engineering',
        href: '/departments/computer-engineering',
        description: 'Combines electrical engineering and computer science to develop computer hardware and software systems.'
      },
      {
        title: 'Electrical/Electronic Engineering',
        href: '/departments/electrical-electronic-engineering',
        description: 'Focuses on electrical systems, electronic devices, and electromagnetic applications for power generation and transmission.'
      },
      {
        title: 'Food Engineering',
        href: '/departments/food-engineering',
        description: 'Applies engineering principles to food production, processing, preservation, and packaging systems.'
      },
      {
        title: 'Mechanical Engineering',
        href: '/departments/mechanical-engineering',
        description: 'Involves designing, analyzing, and manufacturing mechanical systems and thermal devices.'
      },
      {
        title: 'Petroleum Engineering',
        href: '/departments/petroleum-engineering',
        description: 'Specializes in the exploration, extraction, and production of oil, gas, and other resources from the earth.'
      }
    ]
  },
  { title: 'Materials Archive', href: '/materials' },
  { title: 'Requests', href: '/requests' }
]

export default function NavBar ({
  siteTitle = BRAND_NAME,
  logo = <QuireMark size={28} />,
  ctaText = 'Login',
  ctaHref = '/auth/login'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [openCollapsible, setOpenCollapsible] = useState('')
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, loading } = useAuth()

  const { mutateAsync: logoutMutation } = useMutation({
    mutationFn: async () => await authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['authUser'], null)
      toast.success('Logged out successfully')
      setIsOpen(false)
      navigate('/')
    },
    onError: err => {
      toast.error(err?.response?.data?.message ?? 'Logout failed')
    }
  })

  const handleLogout = async () => {
    await logoutMutation()
  }

  const displayName = user?.name ?? user?.email ?? 'Account'
  const fallbackInitials = (displayName?.trim().split(/\s+/).slice(0, 2).map(word => word.charAt(0)).join('') ?? 'A').toUpperCase() || 'A'

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      <header className='sticky top-4 z-50 w-full bg-transparent px-4'>
        <div className='relative mx-auto max-w-5xl'>
          <div className='flex h-14 items-center justify-between gap-6 rounded-xl border bg-card/95 px-4 shadow-soft-lift backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-6'>
        {/* Logo and site title */}
        <Link to='/' className='flex items-center gap-2.5'>
          {logo}
          <span className='truncate text-sm font-bold tracking-tight sm:text-base'>
            {siteTitle}
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className='hidden flex-1 justify-center lg:flex'>
          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map(item => {
                if (item.children) {
                  return (
                    <NavigationMenuItem key={item.title}>
                      <NavigationMenuTrigger
                        className={cn(
                          'hover:bg-accent/40 data-[state=open]:bg-accent/40',
                          pathname.startsWith('/departments') && 'text-primary font-semibold'
                        )}
                      >
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className='grid w-[420px] gap-2 p-3 md:w-[520px] md:grid-cols-2 lg:w-[600px]'>
                          {item.children.map(child => (
                            <li key={child.title}>
                              <NavigationMenuLink asChild>
                                <a
                                  href={child.href}
                                  className='block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent/60 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                                >
                                  <div className='text-sm font-semibold tracking-tight'>
                                    {child.title}
                                  </div>
                                  {child.description && (
                                    <p className='line-clamp-2 pt-1 text-xs leading-snug text-muted-foreground'>
                                      {child.description}
                                    </p>
                                  )}
                                </a>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  )
                }

                return (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'hover:bg-accent/40',
                        pathname === item.href && 'text-primary font-semibold'
                      )}
                      asChild
                    >
                      <a href={item.href}>{item.title}</a>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* CTA - the single primary color use in the nav */}
        <div className='hidden lg:block'>
          {loading ? (
            <div
              className='size-9 animate-pulse rounded-full bg-muted'
              aria-hidden='true'
            />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className='h-9 w-9 cursor-pointer border-2 border-primary/60 font-bold shadow-card'>
                  <AvatarFallback>{fallbackInitials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='flex items-center'>
                  <div>
                    <p>{user?.name}</p>
                    <p className='text-xs text-muted-foreground'>{user?.email}</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className='cursor-pointer'>
                  <Link to='/dashboard'>
                    <BookOpen className='mr-2 h-4 w-4' />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant='destructive'
                  onClick={handleLogout}
                  className='cursor-pointer'
                >
                  <SignOut className='mr-2 h-4 w-4' />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size='sm'>
              <Link to={ctaHref}>{ctaText}</Link>
            </Button>
          )}
        </div>

            {/* Mobile menu — top dropdown under the pill */}
            <Button
              variant='ghost'
              size='icon'
              aria-label='Toggle menu'
              aria-expanded={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              className='lg:hidden rounded-sm hover:bg-muted/60 active:bg-muted/80'
            >
              <span className='relative block h-3.5 w-5' aria-hidden>
                <span
                  className={cn(
                    'absolute left-0 top-0 h-[2px] w-3/5 rounded-full bg-current transition-all duration-300 ease-nuesa',
                    isOpen && 'top-1/2 w-full -translate-y-1/2 rotate-45'
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full bg-current transition-all duration-300 ease-nuesa',
                    isOpen && 'opacity-0'
                  )}
                />
                <span
                  className={cn(
                    'absolute bottom-0 left-0 h-[2px] w-4/5 rounded-full bg-current transition-all duration-300 ease-nuesa',
                    isOpen && 'bottom-1/2 w-full translate-y-1/2 -rotate-45'
                  )}
                />
              </span>
              <span className='sr-only'>Toggle menu</span>
            </Button>
          </div>

          {/* Dropdown panel — animates top → bottom under the pill */}
          <div
            className={cn(
              'absolute left-0 right-0 top-full z-50 mt-2 origin-top overflow-hidden rounded-xl border bg-card shadow-modal transition-all duration-300 ease-nuesa lg:hidden',
              isOpen ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-95 opacity-0'
            )}
            style={{ transformOrigin: 'top' }}
            aria-hidden={!isOpen}
          >
          <div className='flex flex-col gap-4 p-4'>
            <nav className='flex flex-col gap-1'>
              {navItems.map(item => (
                <div key={item.title}>
                  {item.children ? (
                    <Collapsible
                      open={openCollapsible === item.title}
                      onOpenChange={(open) => setOpenCollapsible(open ? item.title : '')}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant='ghost' className='w-full justify-between font-medium'>
                          {item.title}
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ease-nuesa ${openCollapsible === item.title ? 'rotate-180' : ''}`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className='pb-2 pl-3 pt-1'>
                        <div className='flex flex-col gap-0.5 border-l pl-3'>
                          <a
                            href={item.href}
                            className='rounded-sm py-2 text-sm font-semibold text-primary'
                            onClick={() => setIsOpen(false)}
                          >
                            View All Departments
                          </a>
                          {item.children.map(child => (
                            <a
                              key={child.title}
                              href={child.href}
                              className='rounded-sm px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground'
                              onClick={() => setIsOpen(false)}
                            >
                              {child.title}
                            </a>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <a
                      href={item.href}
                      className={cn(
                        'flex items-center rounded-sm px-4 py-2 text-base font-medium transition-colors hover:bg-accent/60 hover:text-accent-foreground',
                        pathname === item.href && 'text-primary font-semibold'
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.title}
                    </a>
                  )}
                </div>
              ))}
            </nav>
            {loading ? (
              <div
                className='flex items-center gap-3 rounded-sm px-4 py-2'
                aria-hidden='true'
              >
                <div className='size-9 animate-pulse rounded-full bg-muted' />
                <div className='h-4 w-24 animate-pulse rounded-sm bg-muted' />
              </div>
            ) : user ? (
              <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-3 rounded-sm px-4 py-2'>
                  <Avatar className='h-9 w-9 border-2 border-primary/60 font-bold shadow-card'>
                    <AvatarFallback>{fallbackInitials}</AvatarFallback>
                  </Avatar>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-semibold'>{user?.name}</p>
                    <p className='truncate text-xs text-muted-foreground'>
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Button asChild className='w-full'>
                  <Link to='/dashboard' onClick={() => setIsOpen(false)}>
                    <BookOpen className='mr-2 h-4 w-4' />
                    Dashboard
                  </Link>
                </Button>
                <Button
                  variant='outline'
                  className='w-full text-destructive'
                  onClick={handleLogout}
                >
                  <SignOut className='mr-2 h-4 w-4' />
                  Log out
                </Button>
              </div>
            ) : (
              <Button asChild className='w-full'>
                <Link to={ctaHref} onClick={() => setIsOpen(false)}>
                  {ctaText}
                </Link>
              </Button>
            )}
          </div>
        </div>
        </div>
      </header>
    </>
  )
}