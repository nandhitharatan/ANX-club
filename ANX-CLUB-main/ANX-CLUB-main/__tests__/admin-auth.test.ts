import { verifyAuthToken } from '@/lib/firebase/admin-auth'

// Mock Firebase Admin modules
jest.mock('@/lib/firebase/admin', () => {
  return {
    adminAuth: {
      verifyIdToken: jest.fn(),
    },
    adminDb: {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
    },
  }
})

import { adminAuth, adminDb } from '@/lib/firebase/admin'

describe('verifyAuthToken', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return null if no Authorization header is provided', async () => {
    const req = new Request('http://localhost')
    const result = await verifyAuthToken(req)
    expect(result).toBeNull()
  })

  it('should return null if Authorization header does not start with Bearer', async () => {
    const req = new Request('http://localhost', {
      headers: { Authorization: 'Basic token' },
    })
    const result = await verifyAuthToken(req)
    expect(result).toBeNull()
  })

  it('should successfully verify token and return user with role from claims', async () => {
    const req = new Request('http://localhost', {
      headers: { Authorization: 'Bearer valid_token' },
    });

    (adminAuth.verifyIdToken as jest.Mock).mockResolvedValueOnce({
      uid: 'user123',
      email: 'test@example.com',
      role: 'Admin',
    })

    const result = await verifyAuthToken(req)
    expect(result).toEqual({
      uid: 'user123',
      email: 'test@example.com',
      role: 'Admin',
    })
    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith('valid_token')
  })

  it('should fallback to Firestore to fetch role if not in claims', async () => {
    const req = new Request('http://localhost', {
      headers: { Authorization: 'Bearer valid_token_no_claim' },
    });

    (adminAuth.verifyIdToken as jest.Mock).mockResolvedValueOnce({
      uid: 'user456',
      email: 'test2@example.com',
    });

    const mockGet = jest.fn().mockResolvedValueOnce({
      exists: true,
      data: () => ({ role: 'Premium Member' }),
    });

    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: mockGet,
      }),
    });

    const result = await verifyAuthToken(req)
    expect(result).toEqual({
      uid: 'user456',
      email: 'test2@example.com',
      role: 'Premium Member',
    })
  })

  it('should default to user role if Firestore fetch fails', async () => {
    const req = new Request('http://localhost', {
      headers: { Authorization: 'Bearer valid_token_fail' },
    });

    (adminAuth.verifyIdToken as jest.Mock).mockResolvedValueOnce({
      uid: 'user789',
      email: 'test3@example.com',
    });

    const mockGet = jest.fn().mockRejectedValueOnce(new Error('DB Error'));

    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: mockGet,
      }),
    });

    const result = await verifyAuthToken(req)
    expect(result).toEqual({
      uid: 'user789',
      email: 'test3@example.com',
      role: 'user', // Default role
    })
  })
})
