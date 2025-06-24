import React from 'react';
import { FileUpload } from '../fileUpload';

/**
 * Props for ChatActions component
 */
interface ChatActionsProps {
  /** The type of action to display */
  type: 'fileUpload' | 'survey' | 'feedback';
  /** Session UUID for API calls */
  sessionUUID: string;
  /** Event handler for when a file is uploaded */
  onFileUploaded?: (file: File) => void;
  /** Event handler for when file upload is complete */
  onDone?: () => void;
}

/**
 * Component to display contextual actions in the chat
 *
 * This component handles rendering different action types
 * like file uploads, surveys, or feedback forms based on the current
 * chat state and context.
 */
const ChatActions: React.FC<ChatActionsProps> = ({ type, sessionUUID, onFileUploaded, onDone }) => {
  switch (type) {
    case 'fileUpload':
      return (
        <FileUpload
          onFileUploaded={
            onFileUploaded ||
            (file => {
              console.log('File uploaded:', file.name);
            })
          }
          onDone={
            onDone ||
            (() => {
              console.log('File upload completed');
            })
          }
          sessionUUID={sessionUUID}
        />
      );
    case 'survey':
      // Survey form would go here
      return <div className="survey-placeholder">Survey would go here</div>;
    case 'feedback':
      // Feedback form would go here
      return <div className="feedback-placeholder">Feedback form would go here</div>;
    default:
      return null;
  }
};

export default ChatActions;
