import { render, screen } from '@testing-library/react';
import { useSessionUUID } from './useSessionUUID';
import * as sessionUtils from '../utils/sessionUtils';

function TestComponent() {
  const uuid = useSessionUUID();
  return <div data-testid="uuid">{uuid}</div>;
}

describe('useSessionUUID', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return a UUID from sessionUtils', () => {
    const spy = jest.spyOn(sessionUtils, 'getOrCreateSessionUUID').mockReturnValue('mock-uuid');
    render(<TestComponent />);
    expect(screen.getByTestId('uuid').textContent).toBe('mock-uuid');
    spy.mockRestore();
  });
});
