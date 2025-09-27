'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Book, Home, MultiplePages, Settings, User } from 'iconoir-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

/**
 * This component uses the UI Kit to navigate between pages
 * Bottom navigation is the most common navigation pattern in Mini Apps
 * We require mobile first design patterns for mini apps
 * Read More: https://docs.world.org/mini-apps/design/app-guidelines#mobile-first
 */

const tabs = [
  {
    value: '/home',
    icon: <Home />,
    label: 'Home',
    match: ['/home'],
  },
  {
    value: '/lobbies',
    icon: <MultiplePages />,
    label: 'Lobbies',
    match: ['/lobbies', '/lobby'],
  },
  {
    value: '/build',
    icon: <Settings />,
    label: 'Build',
    match: ['/build'],
  },
  {
    value: '/guide',
    icon: <Book />,
    label: 'Guide',
    match: ['/guide'],
  },
  {
    value: '/profile',
    icon: <User />,
    label: 'Profile',
    match: ['/profile'],
  },
];

export const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const initialValue = useMemo(() => {
    const match = tabs.find((tab) =>
      tab.match.some((route) => pathname?.startsWith(route)),
    );
    return match ? match.value : '/home';
  }, [pathname]);

  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        router.push(nextValue);
      }}
    >
      {tabs.map((tab) => (
        <TabItem key={tab.value} value={tab.value} icon={tab.icon} label={tab.label} />
      ))}
    </Tabs>
  );
};
