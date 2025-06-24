import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

/**
 * File status interface
 */
export interface FileStatus {
  /** Unique identifier for the file */
  id: string;
  /** Name of the file */
  name: string;
  /** Whether the file is currently uploading */
  isUploading: boolean;
  /** Whether the file has been successfully uploaded */
  isComplete: boolean;
  /** Error message, if there was an error uploading the file */
  error?: string;
}

/**
 * File upload state interface
 */
export interface FileUploadState {
  /** List of files with their upload status */
  files: FileStatus[];
  /** Whether file upload is currently available */
  isUploadEnabled: boolean;
  /** Whether all file uploads are complete */
  allComplete: boolean;
  /** Global error message, if any */
  error: string | null;
}

/**
 * File upload action types
 */
export enum FileUploadActionTypes {
  ADD_FILE = 'ADD_FILE',
  SET_FILE_UPLOADING = 'SET_FILE_UPLOADING',
  SET_FILE_COMPLETE = 'SET_FILE_COMPLETE',
  SET_FILE_ERROR = 'SET_FILE_ERROR',
  SET_UPLOAD_ENABLED = 'SET_UPLOAD_ENABLED',
  SET_ALL_COMPLETE = 'SET_ALL_COMPLETE',
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
  RESET = 'RESET',
}

/**
 * File upload action interface
 */
export type FileUploadAction =
  | { type: FileUploadActionTypes.ADD_FILE; payload: { id: string; name: string } }
  | { type: FileUploadActionTypes.SET_FILE_UPLOADING; payload: { id: string } }
  | { type: FileUploadActionTypes.SET_FILE_COMPLETE; payload: { id: string } }
  | { type: FileUploadActionTypes.SET_FILE_ERROR; payload: { id: string; error: string } }
  | { type: FileUploadActionTypes.SET_UPLOAD_ENABLED; payload: { enabled: boolean } }
  | { type: FileUploadActionTypes.SET_ALL_COMPLETE; payload: { complete: boolean } }
  | { type: FileUploadActionTypes.SET_ERROR; payload: { error: string } }
  | { type: FileUploadActionTypes.CLEAR_ERROR; payload: Record<string, never> }
  | { type: FileUploadActionTypes.RESET; payload: Record<string, never> };

/**
 * Initial file upload state
 */
const initialState: FileUploadState = {
  files: [],
  isUploadEnabled: true,
  allComplete: false,
  error: null,
};

/**
 * File upload reducer function
 */
const fileUploadReducer = (state: FileUploadState, action: FileUploadAction): FileUploadState => {
  switch (action.type) {
    case FileUploadActionTypes.ADD_FILE:
      return {
        ...state,
        files: [
          ...state.files,
          {
            id: action.payload.id,
            name: action.payload.name,
            isUploading: false,
            isComplete: false,
          },
        ],
      };

    case FileUploadActionTypes.SET_FILE_UPLOADING:
      return {
        ...state,
        files: state.files.map(file =>
          file.id === action.payload.id ? { ...file, isUploading: true } : file
        ),
      };

    case FileUploadActionTypes.SET_FILE_COMPLETE:
      return {
        ...state,
        files: state.files.map(file =>
          file.id === action.payload.id ? { ...file, isUploading: false, isComplete: true } : file
        ),
      };

    case FileUploadActionTypes.SET_FILE_ERROR:
      return {
        ...state,
        files: state.files.map(file =>
          file.id === action.payload.id
            ? { ...file, isUploading: false, error: action.payload.error }
            : file
        ),
      };

    case FileUploadActionTypes.SET_UPLOAD_ENABLED:
      return {
        ...state,
        isUploadEnabled: action.payload.enabled,
      };

    case FileUploadActionTypes.SET_ALL_COMPLETE:
      return {
        ...state,
        allComplete: action.payload.complete,
      };

    case FileUploadActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload.error,
      };

    case FileUploadActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case FileUploadActionTypes.RESET:
      return initialState;

    default:
      return state;
  }
};

/**
 * File upload context interface
 */
interface FileUploadContextValue {
  /** Current file upload state */
  state: FileUploadState;
  /** Function to add a file */
  addFile: (id: string, name: string) => void;
  /** Function to set a file as uploading */
  setFileUploading: (id: string) => void;
  /** Function to set a file as complete */
  setFileComplete: (id: string) => void;
  /** Function to set a file error */
  setFileError: (id: string, error: string) => void;
  /** Function to enable/disable file upload */
  setUploadEnabled: (enabled: boolean) => void;
  /** Function to mark all file uploads as complete */
  setAllComplete: (complete: boolean) => void;
  /** Function to set a global error message */
  setError: (error: string) => void;
  /** Function to clear the global error message */
  clearError: () => void;
  /** Function to reset the file upload state */
  reset: () => void;
}

/**
 * File upload context
 */
const FileUploadContext = createContext<FileUploadContextValue | undefined>(undefined);

/**
 * File upload provider props
 */
interface FileUploadProviderProps {
  /** Child components */
  children: ReactNode;
}

/**
 * File upload context provider component
 */
export const FileUploadProvider: React.FC<FileUploadProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(fileUploadReducer, initialState);

  const addFile = useCallback((id: string, name: string) => {
    dispatch({ type: FileUploadActionTypes.ADD_FILE, payload: { id, name } });
  }, []);

  const setFileUploading = useCallback((id: string) => {
    dispatch({ type: FileUploadActionTypes.SET_FILE_UPLOADING, payload: { id } });
  }, []);

  const setFileComplete = useCallback((id: string) => {
    dispatch({ type: FileUploadActionTypes.SET_FILE_COMPLETE, payload: { id } });
  }, []);

  const setFileError = useCallback((id: string, error: string) => {
    dispatch({ type: FileUploadActionTypes.SET_FILE_ERROR, payload: { id, error } });
  }, []);

  const setUploadEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: FileUploadActionTypes.SET_UPLOAD_ENABLED, payload: { enabled } });
  }, []);

  const setAllComplete = useCallback((complete: boolean) => {
    dispatch({ type: FileUploadActionTypes.SET_ALL_COMPLETE, payload: { complete } });
  }, []);

  const setError = useCallback((error: string) => {
    dispatch({ type: FileUploadActionTypes.SET_ERROR, payload: { error } });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: FileUploadActionTypes.CLEAR_ERROR, payload: {} });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: FileUploadActionTypes.RESET, payload: {} });
  }, []);

  const value = {
    state,
    addFile,
    setFileUploading,
    setFileComplete,
    setFileError,
    setUploadEnabled,
    setAllComplete,
    setError,
    clearError,
    reset,
  };

  return <FileUploadContext.Provider value={value}>{children}</FileUploadContext.Provider>;
};

/**
 * Hook to use the file upload context
 */
export const useFileUpload = (): FileUploadContextValue => {
  const context = useContext(FileUploadContext);
  if (context === undefined) {
    throw new Error('useFileUpload must be used within a FileUploadProvider');
  }
  return context;
};
