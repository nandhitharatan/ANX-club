/**
 * @jest-environment jsdom
 */

// Define global.fetch before imports
const mockFetch = jest.fn()
global.fetch = mockFetch

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock admin-auth-config to avoid loading Firebase client in jsdom
jest.mock('@/lib/admin-auth-config', () => ({
  isOfficialAdminEmail: (email: string | null | undefined) => {
    if (!email) return false
    const clean = email.trim().toLowerCase()
    return clean === 'admin@anxclub.dev' || clean === 'admin@algorithmaliens.com' || clean.startsWith('admin@')
  },
}))

import StudentHeadLayout from '@/app/(student-head)/student-head/layout'
import StudentHeadDashboardPage from '@/app/(student-head)/student-head/page'
import * as authHelpers from '@/lib/auth-helpers'

// Mock next/navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()
let currentPathname = '/student-head'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => currentPathname,
}))

// Auth state mock controller
let authMockState = {
  user: { uid: 'head_usr_1', email: 'lead@gec.edu' } as any,
  profile: {
    uid: 'head_usr_1',
    email: 'lead@gec.edu',
    fullName: 'Nandhitha Ratan',
    role: 'Student Head',
    collegeName: 'Government Engineering College',
    collegeId: 'gec-campus-1',
  } as any,
  loading: false,
  logout: jest.fn().mockResolvedValue(undefined),
}

jest.mock('@/modules/module3/components/AuthContext', () => ({
  useAuth: () => authMockState,
}))

// Mock auth-helpers
jest.mock('@/lib/auth-helpers', () => ({
  getAuthToken: jest.fn().mockResolvedValue('mock-student-head-token'),
}))

describe('Student Head Dashboard UI & Navigation Shell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    currentPathname = '/student-head'
    authMockState = {
      user: { uid: 'head_usr_1', email: 'lead@gec.edu' },
      profile: {
        uid: 'head_usr_1',
        email: 'lead@gec.edu',
        fullName: 'Nandhitha Ratan',
        role: 'Student Head',
        collegeName: 'Government Engineering College',
        collegeId: 'gec-campus-1',
      },
      loading: false,
      logout: jest.fn().mockResolvedValue(undefined),
    }
  })

  // =========================================================================
  // SECTION 1: Layout & Navigation Shell
  // =========================================================================
  describe('Navigation Shell & Access Control', () => {
    it('renders loading screen when auth is still loading', () => {
      authMockState.loading = true
      render(
        <StudentHeadLayout>
          <div>Dashboard Child Content</div>
        </StudentHeadLayout>
      )

      expect(screen.getByTestId('student-head-loading-screen')).toBeInTheDocument()
      expect(screen.getByText(/Authenticating chapter credentials/i)).toBeInTheDocument()
    })

    it('renders access restricted screen when user has an unauthorized role', () => {
      authMockState.profile.role = 'Visitor'
      render(
        <StudentHeadLayout>
          <div>Dashboard Child Content</div>
        </StudentHeadLayout>
      )

      expect(screen.getByTestId('student-head-unauthorized-screen')).toBeInTheDocument()
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument()
      expect(screen.getByText(/Student Chapter Lead permissions are required/i)).toBeInTheDocument()
      expect(screen.getByText(/Go to Student Portal/i)).toBeInTheDocument()
    })

    it('renders the layout shell with college chapter badge and navigation links for authorized Student Head', () => {
      render(
        <StudentHeadLayout>
          <div data-testid="test-child">Child Component Loaded</div>
        </StudentHeadLayout>
      )

      // Verified chapter and lead branding
      expect(screen.getAllByText(/ANX Chapter/i)[0]).toBeInTheDocument()
      expect(screen.getAllByText(/Student Lead/i)[0]).toBeInTheDocument()
      expect(screen.getAllByText(/Government Engineering College/i)[0]).toBeInTheDocument()

      // Primary navigation links exist
      expect(screen.getByText('Chapter Overview')).toBeInTheDocument()
      expect(screen.getByText('Manage Events')).toBeInTheDocument()
      expect(screen.getByText('Announcements')).toBeInTheDocument()
      expect(screen.getByText('Student Catalog')).toBeInTheDocument()
      expect(screen.getByText('Student Portal')).toBeInTheDocument()
      expect(screen.getByText('My Profile')).toBeInTheDocument()

      // User profile is visible in sidebar and header
      expect(screen.getAllByText('Nandhitha Ratan')[0]).toBeInTheDocument()
      expect(screen.getByText('lead@gec.edu')).toBeInTheDocument()

      // Child rendered
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })

    it('allows the Student Head to sign out from the sidebar', async () => {
      render(
        <StudentHeadLayout>
          <div>Content</div>
        </StudentHeadLayout>
      )

      const signOutBtn = screen.getByRole('button', { name: /Sign Out/i })
      fireEvent.click(signOutBtn)

      await waitFor(() => {
        expect(authMockState.logout).toHaveBeenCalledTimes(1)
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })
  })

  // =========================================================================
  // SECTION 2: Dashboard Overview Page
  // =========================================================================
  describe('Dashboard Overview Page (/student-head)', () => {
    const mockDashboardApiResponse = {
      success: true,
      college: {
        id: 'gec-campus-1',
        name: 'Government Engineering College',
      },
      stats: {
        totalEvents: 4,
        publishedEvents: 3,
        draftEvents: 1,
        cancelledEvents: 0,
        upcomingEventsCount: 2,
        chapterMembersCount: 42,
        activeAnnouncementsCount: 2,
        pendingReportsCount: 1,
      },
      upcomingEvents: [
        {
          id: 'evt-1',
          title: 'Fullstack Next.js Bootcamp',
          date: '2026-11-15',
          time: '10:00 AM',
          format: 'online',
          registrationType: 'internal',
          capacity: 80,
          seatsBooked: 35,
          normalizedStatus: 'Published',
        },
        {
          id: 'evt-2',
          title: 'Campus Hackathon 2026',
          date: '2026-11-25',
          time: '09:00 AM',
          format: 'offline',
          registrationType: 'external',
          registrationUrl: 'https://forms.gle/gec-hackathon-2026',
          capacity: 150,
          seatsBooked: 110,
          normalizedStatus: 'Published',
        },
      ],
      recentAnnouncements: [
        {
          id: 'ann-1',
          title: 'Registration Open for November Hackathon',
          content: 'Seats are filling rapidly for our flagship annual coding sprint.',
          createdAt: '2026-11-01T10:00:00Z',
        },
      ],
    }

    it('displays loading skeleton while fetching chapter metrics', async () => {
      // Pending fetch promise
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      render(<StudentHeadDashboardPage />)

      expect(screen.getByTestId('student-head-page-loading')).toBeInTheDocument()
    })

    it('renders full chapter metrics, upcoming events, and announcements when API succeeds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardApiResponse,
      })

      render(<StudentHeadDashboardPage />)

      await waitFor(() => {
        expect(screen.getByTestId('student-head-dashboard-content')).toBeInTheDocument()
      })

      // Welcome header & chapter badges
      expect(screen.getByText(/Welcome back, Nandhitha Ratan!/i)).toBeInTheDocument()
      expect(screen.getByText('Government Engineering College')).toBeInTheDocument()
      expect(screen.getByText('Chapter Active')).toBeInTheDocument()

      // 4 Metric cards
      expect(screen.getByText('42')).toBeInTheDocument() // Members count
      expect(screen.getByText('Chapter Members')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument() // Total events
      expect(screen.getByText(/3 published · 1 drafts/i)).toBeInTheDocument()
      expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument()
      expect(screen.getByText('Event Reports')).toBeInTheDocument()

      // Pending reports banner
      expect(screen.getByText(/1 Post-Event Report Pending Submission/i)).toBeInTheDocument()

      // Upcoming events list
      expect(screen.getByText('Fullstack Next.js Bootcamp')).toBeInTheDocument()
      expect(screen.getByText('ANX Registration')).toBeInTheDocument()
      expect(screen.getByText('Campus Hackathon 2026')).toBeInTheDocument()
      expect(screen.getByText('External Form')).toBeInTheDocument()

      // External registration URL link
      const formLink = screen.getByTitle('Open external registration URL')
      expect(formLink).toHaveAttribute('href', 'https://forms.gle/gec-hackathon-2026')
      expect(formLink).toHaveAttribute('target', '_blank')

      // Announcements list
      expect(screen.getByText('Registration Open for November Hackathon')).toBeInTheDocument()
      expect(screen.getByText(/Seats are filling rapidly/i)).toBeInTheDocument()

      // Quick action button
      expect(screen.getByText('Schedule Event')).toBeInTheDocument()
    })

    it('renders empty state when there are no upcoming chapter events', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockDashboardApiResponse,
          stats: { ...mockDashboardApiResponse.stats, upcomingEventsCount: 0, pendingReportsCount: 0 },
          upcomingEvents: [],
        }),
      })

      render(<StudentHeadDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('No Upcoming Events Scheduled')).toBeInTheDocument()
      })

      expect(
        screen.getByText(/Your chapter has no upcoming events on the calendar/i)
      ).toBeInTheDocument()
    })

    it('displays unassigned college warning when API responds with 403 no assigned college', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          message: 'Forbidden: Student Head account has no assigned college.',
        }),
      })

      render(<StudentHeadDashboardPage />)

      await waitFor(() => {
        expect(screen.getByTestId('student-head-unassigned-college-error')).toBeInTheDocument()
      })

      expect(screen.getByText(/College Chapter Assignment Required/i)).toBeInTheDocument()
      expect(screen.getByText(/an administrator has not yet assigned you to a specific college chapter/i)).toBeInTheDocument()
      expect(screen.getByText(/Re-check Status/i)).toBeInTheDocument()
      expect(screen.getByText(/Return to Student Portal/i)).toBeInTheDocument()
    })

    it('displays retryable error state when database service is unavailable (503)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          success: false,
          message: 'Database service unavailable. Unable to load chapter events.',
        }),
      })

      render(<StudentHeadDashboardPage />)

      await waitFor(() => {
        expect(screen.getByTestId('student-head-error-screen')).toBeInTheDocument()
      })

      expect(screen.getByText('Chapter Dashboard Error')).toBeInTheDocument()
      expect(screen.getByText(/Database service unavailable/i)).toBeInTheDocument()

      // Click retry
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardApiResponse,
      })

      const retryBtn = screen.getByRole('button', { name: /Try again/i })
      fireEvent.click(retryBtn)

      await waitFor(() => {
        expect(screen.getByTestId('student-head-dashboard-content')).toBeInTheDocument()
      })
    })

    it('allows refreshing chapter data using the refresh button', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardApiResponse,
      })

      render(<StudentHeadDashboardPage />)

      await waitFor(() => {
        expect(screen.getByTestId('student-head-dashboard-content')).toBeInTheDocument()
      })

      // Click refresh button
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockDashboardApiResponse,
          stats: {
            ...mockDashboardApiResponse.stats,
            chapterMembersCount: 45,
          },
        }),
      })

      const refreshBtn = screen.getByTitle('Refresh chapter data')
      fireEvent.click(refreshBtn)

      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument()
      })
    })
  })
})
