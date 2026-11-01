/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import EventForm from '@/components/admin/EventForm'
import * as authHelpers from '@/lib/auth-helpers'

// Mock next/navigation
const mockPush = jest.fn()
const mockBack = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useParams: () => ({
    id: 'evt-test-100',
  }),
}))

// Mock AuthContext
jest.mock('@/modules/module3/components/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'admin_test_1', email: 'admin@algorithmaliens.com', role: 'Admin' },
  }),
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}))

// Mock auth-helpers
jest.mock('@/lib/auth-helpers', () => ({
  getAuthToken: jest.fn().mockResolvedValue('mock-admin-token'),
}))

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Admin Event Editing UI & Form Integration', () => {
  const sampleEventData = {
    id: 'evt-test-100',
    title: 'Advanced AI Architecture',
    description: 'Deep dive into fullstack LLM pipelines and server actions.',
    category: 'workshop',
    date: '2026-12-15T00:00:00.000Z',
    endDate: '2026-12-16T00:00:00.000Z',
    time: '11:00 AM',
    duration: 180,
    registrationDeadline: '2026-12-10T00:00:00.000Z',
    collegeName: 'All Campuses (Global Ecosystem)',
    collegeId: '',
    registrationType: 'internal',
    isOnline: false,
    venue: 'Hall B, CS Department',
    address: 'Gate 3, Campus Tech Park',
    speaker: 'Dr. Evelyn Reed',
    speakerRole: 'AI Research Lead',
    speakerCompany: 'DeepMind Labs',
    speakerBio: 'Leading neural reasoning researcher.',
    speakerImage: 'https://images.unsplash.com/photo-speaker.jpg',
    capacity: 100,
    seatsBooked: 35,
    registeredCount: 35,
    seatsAvailable: 65,
    price: 199,
    premiumOnly: true,
    premiumPrice: 99,
    agenda: ['11:00 AM - Keynote', '12:00 PM - Code Lab'],
    status: 'Published',
    normalizedStatus: 'Published',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockReset()
  })

  it('renders Edit Event form and prepopulates all fields from initialData', () => {
    render(
      <EventForm 
        mode="edit" 
        initialData={sampleEventData} 
        eventId="evt-test-100" 
      />
    )

    // Header and status badge
    expect(screen.getByText('Edit Event Details')).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()

    // Form inputs prepopulated
    expect(screen.getByDisplayValue('Advanced AI Architecture')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Deep dive into fullstack LLM pipelines and server actions.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-12-15')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-12-16')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-12-10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('11:00 AM')).toBeInTheDocument()
    expect(screen.getByDisplayValue('180')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hall B, CS Department')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Dr. Evelyn Reed')).toBeInTheDocument()
    expect(screen.getByDisplayValue('AI Research Lead')).toBeInTheDocument()
    expect(screen.getByDisplayValue('DeepMind Labs')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    expect(screen.getByDisplayValue('199')).toBeInTheDocument()

    // Agenda slots
    expect(screen.getByText('11:00 AM - Keynote')).toBeInTheDocument()
    expect(screen.getByText('12:00 PM - Code Lab')).toBeInTheDocument()

    // Booked seats warning badge
    expect(screen.getByText(/Currently Booked: 35 seats/i)).toBeInTheDocument()
  })

  it('renders Create Event form with default fields when mode is create', () => {
    render(<EventForm mode="create" />)

    expect(screen.getByText('Schedule New Event')).toBeInTheDocument()
    expect(screen.getByText('Publish Event to Database')).toBeInTheDocument()
    expect(screen.getByText('Save as Draft')).toBeInTheDocument()
  })

  it('enforces capacity floor in edit mode when seats are booked', async () => {
    const toast = require('react-hot-toast')

    render(
      <EventForm 
        mode="edit" 
        initialData={sampleEventData} 
        eventId="evt-test-100" 
      />
    )

    const capacityInput = screen.getByDisplayValue('100')
    // Attempt to reduce capacity below 35 seats booked
    fireEvent.change(capacityInput, { target: { value: '20' } })

    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Cannot reduce capacity to 20. At least 35 seats are already booked.')
      )
    })

    // Fetch must not have been called
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('submits updated event data via PUT /api/v1/events/:id on valid edit submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Event updated.',
        data: { ...sampleEventData, title: 'Updated Title' },
      }),
    })

    const handleSuccess = jest.fn()

    render(
      <EventForm 
        mode="edit" 
        initialData={sampleEventData} 
        eventId="evt-test-100" 
        onSuccess={handleSuccess}
      />
    )

    // Change title
    const titleInput = screen.getByDisplayValue('Advanced AI Architecture')
    fireEvent.change(titleInput, { target: { value: 'Updated Title Masterclass' } })

    // Change capacity from 100 to 150
    const capacityInput = screen.getByDisplayValue('100')
    fireEvent.change(capacityInput, { target: { value: '150' } })

    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/events/evt-test-100',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-admin-token',
          }),
        })
      )
    })

    // Verify submitted payload
    const submittedPayload = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(submittedPayload.title).toBe('Updated Title Masterclass')
    expect(submittedPayload.capacity).toBe(150)
    expect(handleSuccess).toHaveBeenCalled()
  })

  it('adds and removes interactive agenda slots', () => {
    render(
      <EventForm 
        mode="edit" 
        initialData={sampleEventData} 
        eventId="evt-test-100" 
      />
    )

    const agendaInput = screen.getByPlaceholderText(/Architecture Deep Dive/i)
    fireEvent.change(agendaInput, { target: { value: '01:30 PM - Live Demo & Q&A' } })

    const addSlotButton = screen.getByText('Add Slot')
    fireEvent.click(addSlotButton)

    expect(screen.getByText('01:30 PM - Live Demo & Q&A')).toBeInTheDocument()

    // Remove first slot
    const removeButtons = screen.getAllByTitle('Remove slot')
    fireEvent.click(removeButtons[0])

    expect(screen.queryByText('11:00 AM - Keynote')).not.toBeInTheDocument()
  })
})
