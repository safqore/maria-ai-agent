import { getOrCreateSessionUUID, resetSessionUUID } from './sessionUtils';
import * as uuidApi from './uuidApi';

jest.mock('./uuidApi');
const mockedGenerateUUID = uuidApi.generateUUID as jest.Mock;
const mockedValidateUUID = uuidApi.validateUUID as jest.Mock;

// Ensure a clean localStorage and mocks for each test
// window.location.reload is globally mocked in setupTests.ts

describe('sessionUtils (async, backend integration)', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockedGenerateUUID.mockReset();
    mockedValidateUUID.mockReset();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('should generate and store a new UUID if none exists', async () => {
    mockedGenerateUUID.mockResolvedValue({ status: 'success', uuid: 'mock-uuid-1', message: 'ok' });
    mockedValidateUUID.mockResolvedValue({ status: 'success', uuid: null, message: 'ok' }); // Defensive default
    const uuid = await getOrCreateSessionUUID();
    expect(uuid).toBe('mock-uuid-1');
    expect(localStorage.getItem('session_uuid')).toBe('mock-uuid-1');
  });

  it('should return the existing UUID if present and valid', async () => {
    localStorage.setItem('session_uuid', 'mock-uuid-2');
    mockedValidateUUID.mockResolvedValue({ status: 'success', uuid: 'mock-uuid-2', message: 'ok' });
    mockedGenerateUUID.mockResolvedValue({
      status: 'success',
      uuid: 'should-not-be-used',
      message: 'ok',
    }); // Defensive default
    const uuid = await getOrCreateSessionUUID();
    expect(uuid).toBe('mock-uuid-2');
    expect(localStorage.getItem('session_uuid')).toBe('mock-uuid-2');
    expect(mockedGenerateUUID).not.toHaveBeenCalled();
  });

  it('should handle collision by updating UUID', async () => {
    localStorage.setItem('session_uuid', 'old-uuid');
    mockedValidateUUID.mockResolvedValue({
      status: 'collision',
      uuid: 'new-uuid',
      message: 'collision',
    });
    mockedGenerateUUID.mockResolvedValue({
      status: 'success',
      uuid: 'should-not-be-used',
      message: 'ok',
    }); // Defensive default
    const uuid = await getOrCreateSessionUUID();
    expect(uuid).toBe('new-uuid');
    expect(localStorage.getItem('session_uuid')).toBe('new-uuid');
  });

  it('should handle invalid UUID by resetting session', async () => {
    localStorage.setItem('session_uuid', 'tampered-uuid');
    mockedValidateUUID.mockResolvedValue({ status: 'invalid', uuid: null, message: 'invalid' });
    mockedGenerateUUID.mockResolvedValue({ status: 'success', uuid: 'reset-uuid', message: 'ok' });
    const uuid = await getOrCreateSessionUUID();
    expect(uuid).toBe('reset-uuid');
    expect(localStorage.getItem('session_uuid')).toBe('reset-uuid');
  });

  it('should throw if backend fails to generate UUID', async () => {
    mockedGenerateUUID.mockResolvedValue({ status: 'error', uuid: null, message: 'fail' });
    mockedValidateUUID.mockResolvedValue({ status: 'success', uuid: null, message: 'ok' }); // Defensive default
    await expect(getOrCreateSessionUUID()).rejects.toThrow('fail');
  });

  it('resetSessionUUID should request new UUID and store it', async () => {
    mockedGenerateUUID.mockResolvedValue({
      status: 'success',
      uuid: 'reset-uuid-2',
      message: 'ok',
    });
    mockedValidateUUID.mockResolvedValue({ status: 'success', uuid: null, message: 'ok' }); // Defensive default
    const uuid = await resetSessionUUID();
    expect(uuid).toBe('reset-uuid-2');
    expect(localStorage.getItem('session_uuid')).toBe('reset-uuid-2');
  });

  it('resetSessionUUID should throw if backend fails', async () => {
    mockedGenerateUUID.mockResolvedValue({ status: 'error', uuid: null, message: 'fail' });
    mockedValidateUUID.mockResolvedValue({ status: 'success', uuid: null, message: 'ok' }); // Defensive default
    await expect(resetSessionUUID()).rejects.toThrow('fail');
  });
});
