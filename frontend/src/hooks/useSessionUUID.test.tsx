import { render, screen } from '@testing-library/react';
import { useSessionUUID } from './useSessionUUID';
import * as sessionUtils from '../utils/sessionUtils';

function TestComponent() {
  const { sessionUUID, loading, error } = useSessionUUID();
  if (loading) return <div data-testid="uuid">loading</div>;
  if (error) return <div data-testid="uuid">{error}</div>;
  return <div data-testid="uuid">{sessionUUID}</div>;
}

describe('useSessionUUID', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return a UUID from sessionUtils', async () => {
    const spy = jest.spyOn(sessionUtils, 'getOrCreateSessionUUID').mockResolvedValue('mock-uuid');
    render(<TestComponent />);
    const uuidDiv = await screen.findByTestId('uuid');
    expect(uuidDiv.textContent).not.toBe('loading');
    expect(uuidDiv.textContent).toBe('mock-uuid');
    spy.mockRestore();
  });
});
