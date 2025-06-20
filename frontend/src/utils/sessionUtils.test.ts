import { getOrCreateSessionUUID } from './sessionUtils';

describe('getOrCreateSessionUUID', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should generate and store a new UUID if none exists', () => {
    const uuid = getOrCreateSessionUUID();
    expect(uuid).toBeDefined();
    expect(localStorage.getItem('session_uuid')).toBe(uuid);
  });

  it('should return the existing UUID if present', () => {
    const uuid1 = getOrCreateSessionUUID();
    const uuid2 = getOrCreateSessionUUID();
    expect(uuid2).toBe(uuid1);
  });

  it('should generate a new UUID if the old one is deleted', () => {
    const uuid1 = getOrCreateSessionUUID();
    localStorage.removeItem('session_uuid');
    const uuid2 = getOrCreateSessionUUID();
    expect(uuid2).not.toBe(uuid1);
    expect(localStorage.getItem('session_uuid')).toBe(uuid2);
  });
});
