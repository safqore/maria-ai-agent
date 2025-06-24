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
    const newUuid = '123e4567-e89b-42d3-a456-556642440000';
    mockedGenerateUUID.mockResolvedValue({ status: 'success', uuid: newUuid, message: 'ok' });
    mockedValidateUUID.mockResolvedValue({ status: 'success', uuid: null, message: 'ok' }); // Defensive default
    const uuid = await getOrCreateSessionUUID();
    expect(uuid).toBe(newUuid);
    expect(localStorage.getItem('session_uuid')).toBe(newUuid);
  });

  it('should return the existing UUID if present and valid', async () => {
    // Use a properly formatted UUID v4 that will pass the regex test
    const validUuid = '123e4567-e89b-42d3-a456-556642440000';
    localStorage.setItem('session_uuid', validUuid);
    mockedValidateUUID.mockResolvedValueOnce({ status: 'success', uuid: null, message: 'ok' });
    mockedGenerateUUID.mockResolvedValueOnce({
      status: 'success',
      uuid: 'should-not-be-used',
      message: 'ok',
    }); // Defensive default

    console.log('Starting test with localStorage uuid:', localStorage.getItem('session_uuid'));

    const uuid = await getOrCreateSessionUUID();

    console.log(
      'Validate UUID mock called:',
      mockedValidateUUID.mock.calls.length,
      'times with args:',
      mockedValidateUUID.mock.calls.map(call => call[0])
    );
    console.log('Generate UUID mock called:', mockedGenerateUUID.mock.calls.length, 'times');
    console.log('Return value from getOrCreateSessionUUID:', uuid);

    expect(uuid).toBe(validUuid);
    expect(localStorage.getItem('session_uuid')).toBe(validUuid);
    expect(mockedGenerateUUID).not.toHaveBeenCalled();
  });

  it('should handle collision by updating UUID', async () => {
    // Use a properly formatted UUID v4 that will pass the regex test
    const oldUuid = '123e4567-e89b-42d3-a456-556642440000';
    const newUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    localStorage.setItem('session_uuid', oldUuid);
    mockedValidateUUID.mockResolvedValueOnce({
      status: 'collision',
      uuid: newUuid,
      message: 'collision',
    });
    mockedGenerateUUID.mockResolvedValueOnce({
      status: 'success',
      uuid: 'should-not-be-used',
      message: 'ok',
    }); // Defensive default

    console.log('Starting test with localStorage uuid:', localStorage.getItem('session_uuid'));

    const uuid = await getOrCreateSessionUUID();

    console.log(
      'Validate UUID mock called:',
      mockedValidateUUID.mock.calls.length,
      'times with args:',
      mockedValidateUUID.mock.calls.map(call => call[0])
    );
    console.log('Generate UUID mock called:', mockedGenerateUUID.mock.calls.length, 'times');
    console.log('Return value from getOrCreateSessionUUID:', uuid);

    expect(uuid).toBe(newUuid);
    expect(localStorage.getItem('session_uuid')).toBe(newUuid);
  });

  it('should handle invalid UUID by resetting session', async () => {
    // Even though the UUID will be invalid on the backend, it needs to pass the local regex check
    const tamperedUuid = '123e4567-e89b-42d3-a456-556642440000';
    const resetUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    localStorage.setItem('session_uuid', tamperedUuid);
    mockedValidateUUID.mockResolvedValue({ status: 'invalid', uuid: null, message: 'invalid' });
    mockedGenerateUUID.mockResolvedValue({ status: 'success', uuid: resetUuid, message: 'ok' });
    const uuid = await getOrCreateSessionUUID();
    expect(uuid).toBe(resetUuid);
    expect(localStorage.getItem('session_uuid')).toBe(resetUuid);
  });

  it('should throw if backend fails to generate UUID', async () => {
    mockedGenerateUUID.mockResolvedValue({ status: 'error', uuid: null, message: 'fail' });
    mockedValidateUUID.mockResolvedValue({ status: 'success', uuid: null, message: 'ok' }); // Defensive default
    await expect(getOrCreateSessionUUID()).rejects.toThrow('fail');
  });

  it('resetSessionUUID should request new UUID and store it', async () => {
    const resetUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    mockedGenerateUUID.mockResolvedValue({
      status: 'success',
      uuid: resetUuid,
      message: 'ok',
    });
    mockedValidateUUID.mockResolvedValue({ status: 'success', uuid: null, message: 'ok' }); // Defensive default
    const uuid = await resetSessionUUID();
    expect(uuid).toBe(resetUuid);
    expect(localStorage.getItem('session_uuid')).toBe(resetUuid);
  });

  it('resetSessionUUID should throw if backend fails', async () => {
    mockedGenerateUUID.mockResolvedValue({ status: 'error', uuid: null, message: 'fail' });
    mockedValidateUUID.mockResolvedValue({ status: 'success', uuid: null, message: 'ok' }); // Defensive default
    await expect(resetSessionUUID()).rejects.toThrow('fail');
  });
});
