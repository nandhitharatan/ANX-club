import { GET } from '@/app/api/v1/admin/users/route'
import * as adminAuthUtil from '@/lib/firebase/admin-auth'

// Mock Firebase Admin modules
jest.mock('@/lib/firebase/admin', () => {
  return {
    adminDb: {
      collection: jest.fn(() => ({
        get: jest.fn(),
      })),
    },
  }
})

jest.mock('@/lib/firebase/admin-auth', () => ({
  verifyAuthToken: jest.fn(),
}))

import { adminDb } from '@/lib/firebase/admin'

describe('GET /api/v1/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 403 Forbidden if user is not verified', async () => {
    (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce(null)

    const req = new Request('http://localhost')
    const res = await GET(req)

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json).toEqual({ error: 'Unauthorized: Admins only' })
  })

  it('should return 403 Forbidden if user is verified but not an Admin', async () => {
    (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce({
      uid: 'user123',
      role: 'user'
    })

    const req = new Request('http://localhost')
    const res = await GET(req)

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json).toEqual({ error: 'Unauthorized: Admins only' })
  })

  it('should return 200 OK and list of users if user is an Admin', async () => {
    (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce({
      uid: 'admin123',
      role: 'Admin'
    });

    // Mock Firestore snapshot
    const mockDocs = [
      { id: 'user1', data: () => ({ email: 'a@b.com', role: 'user' }) },
      { id: 'user2', data: () => ({ email: 'c@d.com', role: 'Premium Member' }) }
    ];

    (adminDb.collection as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValueOnce({
        docs: mockDocs
      })
    });

    const req = new Request('http://localhost')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual([
      { id: 'user1', email: 'a@b.com', role: 'user' },
      { id: 'user2', email: 'c@d.com', role: 'Premium Member' }
    ])
  })

  it('should return 500 Internal Server Error if DB fetch fails', async () => {
    (adminAuthUtil.verifyAuthToken as jest.Mock).mockResolvedValueOnce({
      uid: 'admin123',
      role: 'Admin'
    });

    (adminDb.collection as jest.Mock).mockReturnValue({
      get: jest.fn().mockRejectedValueOnce(new Error('Firestore down'))
    });

    const req = new Request('http://localhost')
    const res = await GET(req)

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ error: 'Failed to fetch users' })
  })
})
