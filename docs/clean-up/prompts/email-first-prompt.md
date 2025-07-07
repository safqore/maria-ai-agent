i am working on a new requirement for email verification. look thorugh my codebase and determine the best way to implement this. the way the new requirement should work is as follows:

1. this is through the chat interface.
2. The email has already been entered in the chat interface and correct finite state is selected.
3. the email address is not verified yet.
4. the email address should be in the correct format. Chat interface should keep asking for the correct format, if its not correct.
5. we should go ahead and send the verification email. This should contain a 6 digit alphanumeric code.
6. The chat interface should be asking for this code. Saying "Please enter the 6 digit code sent to your email address".
7. The user should be able to enter the code.
8. If they enter the code incorrectly 3 times, the session should be reset. Like it currenlty does for uuid deletion (use the same code which is there). The use should be made aware of the incorrect tries done and remaining tries.
9. If the code is entered correctly, the user should be able to see a message that their email address has been verified and should see the following message in the chat interface:
   "Thank you for verifying your email address. We will email you once your AI agent is ready."
10. The user should be able to request a new verification email. This should be done by clicking a button in the chat interface. which should wait for 1 minute before it can be clicked again. A max of 3 attempts should be allowed.
11. the code once generated / sent via email should be valid for 10 minutes.

the following are also the changes that i want to make to the chat interface:

1. The done and continue button should be at the bottom rather than on the right of the documents uploaded
2. Can you make this text more precise and to the point
   "Nice to meet you, fu wu! Let's build your personalised AI agent.

To get started, I'll need a document to train on, like a PDF of your business materials, process guides, or product details. This helps me tailor insights just for you!" 3. This text needs to be made more concise and more personalised "Great! Now, please enter your email address so I can send you updates and results." I think it should be something like "please enter your email address so i can notify you once your AI agent is ready"

undertake your analysis and provide me with the best way to implement this. Do not assume anything. Ask me questions where clarity is needed and/or requirements are not clear.
