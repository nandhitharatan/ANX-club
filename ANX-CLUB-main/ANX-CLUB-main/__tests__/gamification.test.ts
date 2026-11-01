import { calculateLeadershipStage } from '@/lib/gamification';

describe('Gamification - Leadership Stages (PRD v2.0 6-Tier Ladder)', () => {
  it('should return Member for XP < 100', () => {
    expect(calculateLeadershipStage(0)).toBe('Member');
    expect(calculateLeadershipStage(50)).toBe('Member');
    expect(calculateLeadershipStage(99)).toBe('Member');
  });

  it('should return Associate for XP between 100 and 349', () => {
    expect(calculateLeadershipStage(100)).toBe('Associate');
    expect(calculateLeadershipStage(200)).toBe('Associate');
    expect(calculateLeadershipStage(349)).toBe('Associate');
  });

  it('should return Lead for XP between 350 and 749', () => {
    expect(calculateLeadershipStage(350)).toBe('Lead');
    expect(calculateLeadershipStage(500)).toBe('Lead');
    expect(calculateLeadershipStage(749)).toBe('Lead');
  });

  it('should return Dept Head for XP between 750 and 1499', () => {
    expect(calculateLeadershipStage(750)).toBe('Dept Head');
    expect(calculateLeadershipStage(1000)).toBe('Dept Head');
    expect(calculateLeadershipStage(1499)).toBe('Dept Head');
  });

  it('should return Core Team for XP between 1500 and 2999', () => {
    expect(calculateLeadershipStage(1500)).toBe('Core Team');
    expect(calculateLeadershipStage(2000)).toBe('Core Team');
    expect(calculateLeadershipStage(2999)).toBe('Core Team');
  });

  it('should return Director for XP >= 3000', () => {
    expect(calculateLeadershipStage(3000)).toBe('Director');
    expect(calculateLeadershipStage(5000)).toBe('Director');
    expect(calculateLeadershipStage(10000)).toBe('Director');
  });
});
