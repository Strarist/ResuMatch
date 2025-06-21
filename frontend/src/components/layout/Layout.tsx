import { Fragment } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Resumes', href: '/resumes' },
  { name: 'Jobs', href: '/jobs' },
  { name: 'Analysis', href: '/analysis' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 transition-colors duration-500">
      <Disclosure as="nav" className="sticky top-0 z-40 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm border-b border-white/20 dark:border-zinc-800/60">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 justify-between items-center">
                <div className="flex items-center">
                  <Link to="/" className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
                    ResuMatch AI
                  </Link>
                  <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          location.pathname === item.href
                            ? 'border-b-2 border-primary-500 text-gray-900 dark:text-white'
                            : 'border-b-2 border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white',
                          'inline-flex items-center px-1 pt-1 text-base font-semibold transition-colors duration-200'
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:flex sm:items-center">
                  {isAuthenticated ? (
                    <Menu as="div" className="relative ml-3">
                      <Menu.Button className="flex rounded-full bg-white/80 dark:bg-zinc-800/80 p-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                        <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-300" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-zinc-900 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/profile"
                                className={classNames(
                                  active ? 'bg-gray-100 dark:bg-zinc-800' : '',
                                  'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                                )}
                              >
                                Your Profile
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={logout}
                                className={classNames(
                                  active ? 'bg-gray-100 dark:bg-zinc-800' : '',
                                  'block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200'
                                )}
                              >
                                Sign out
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <div className="space-x-4">
                      <Link
                        to="/login"
                        className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/register"
                        className="btn-primary"
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
                {/* Hamburger for mobile */}
                <div className="-mr-2 flex items-center sm:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-500 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors">
                    <span className="sr-only">Open main menu</span>
                    <AnimatePresence initial={false} mode="wait">
                      {open ? (
                        <motion.div
                          key="close"
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <XMarkIcon className="block h-7 w-7" aria-hidden="true" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="open"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Bars3Icon className="block h-7 w-7" aria-hidden="true" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-1 pb-3 pt-2">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      to={item.href}
                      className={classNames(
                        location.pathname === item.href
                          ? 'bg-primary-50 dark:bg-zinc-800 border-primary-500 text-primary-700 dark:text-primary-400'
                          : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white',
                        'block border-l-4 py-2 pl-3 pr-4 text-base font-medium transition-colors duration-200'
                      )}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
                {isAuthenticated ? (
                  <div className="border-t border-gray-200 dark:border-zinc-800 pb-3 pt-4">
                    <div className="flex items-center px-4">
                      <div className="flex-shrink-0">
                        <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-300" />
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800 dark:text-white">{user?.name}</div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-300">{user?.email}</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Disclosure.Button
                        as={Link}
                        to="/profile"
                        className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-white transition-colors"
                      >
                        Your Profile
                      </Disclosure.Button>
                      <Disclosure.Button
                        as="button"
                        onClick={logout}
                        className="block w-full px-4 py-2 text-left text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-white transition-colors"
                      >
                        Sign out
                      </Disclosure.Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 dark:border-zinc-800 pb-3 pt-4">
                    <div className="space-y-1">
                      <Disclosure.Button
                        as={Link}
                        to="/login"
                        className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-white transition-colors"
                      >
                        Sign in
                      </Disclosure.Button>
                      <Disclosure.Button
                        as={Link}
                        to="/register"
                        className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-800 dark:hover:text-white transition-colors"
                      >
                        Sign up
                      </Disclosure.Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <main className="flex-1 w-full">
        <div className="w-full max-w-screen-2xl mx-auto px-4 flex flex-col items-center justify-center">
          {children}
        </div>
      </main>
    </div>
  );
} 