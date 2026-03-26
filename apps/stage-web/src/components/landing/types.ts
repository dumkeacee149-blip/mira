export interface LandingSectionLink {
  href: string
  label: string
}

export interface LandingCard {
  body: string
  id: string
  title: string
}

export interface LandingStat {
  label: string
  value: string
}

export interface LandingStep {
  body: string
  title: string
}

export interface LandingRouteCard {
  action: string
  body: string
  title: string
  to: string
}
