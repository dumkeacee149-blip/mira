import { computed } from 'vue'

export type DesktopDownloadPlatform = 'macos' | 'windows'

export interface DesktopDownloadTarget {
  description: string
  directHref?: string
  fileLabel: string
  icon: string
  id: DesktopDownloadPlatform
  isRecommended: boolean
  label: string
  pageHref: string
  statusLabel: string
}

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: {
    platform?: string
  }
}

function normalizeDownloadUrl(value: string | undefined): string | undefined {
  return value?.trim() || undefined
}

function detectDesktopPlatform(): DesktopDownloadPlatform {
  if (typeof navigator === 'undefined')
    return 'windows'

  const userAgentPlatform = (navigator as NavigatorWithUserAgentData).userAgentData?.platform
  const platform = [userAgentPlatform, navigator.platform, navigator.userAgent]
    .filter(Boolean)
    .join(' ')

  return /mac/i.test(platform) ? 'macos' : 'windows'
}

export function useDesktopDownloads() {
  const windowsDirectHref = normalizeDownloadUrl(import.meta.env.VITE_APP_DESKTOP_WINDOWS_DOWNLOAD_URL)
  const macosDirectHref = normalizeDownloadUrl(import.meta.env.VITE_APP_DESKTOP_MACOS_DOWNLOAD_URL)

  const preferredDesktopPlatform = computed<DesktopDownloadPlatform>(() => detectDesktopPlatform())

  const desktopDownloads = computed<DesktopDownloadTarget[]>(() => [
    {
      id: 'windows',
      label: 'Windows',
      description: 'One-click desktop installer for Windows devices.',
      fileLabel: '.exe',
      icon: 'i-simple-icons-windows11',
      pageHref: '/downloads/windows',
      directHref: windowsDirectHref,
      statusLabel: preferredDesktopPlatform.value === 'windows' ? 'Recommended on this device' : 'Desktop installer',
      isRecommended: preferredDesktopPlatform.value === 'windows',
    },
    {
      id: 'macos',
      label: 'macOS',
      description: 'Native desktop installer for Apple Silicon Macs.',
      fileLabel: '.dmg',
      icon: 'i-simple-icons-apple',
      pageHref: '/downloads/macos',
      directHref: macosDirectHref,
      statusLabel: preferredDesktopPlatform.value === 'macos' ? 'Recommended on this device' : 'Desktop installer',
      isRecommended: preferredDesktopPlatform.value === 'macos',
    },
  ])

  return {
    desktopDownloads,
    preferredDesktopPlatform,
  }
}
