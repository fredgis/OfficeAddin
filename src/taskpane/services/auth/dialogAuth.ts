/**
 * Fallback authentication using the Office Dialog API.
 * Opens dialog.html which performs interactive MSAL login,
 * then sends the token back via Office.context.ui.messageParent().
 */
export function openAuthDialog(): Promise<string> {
  return new Promise((resolve, reject) => {
    const dialogUrl = `${window.location.origin}/dialog.html`;
    Office.context.ui.displayDialogAsync(
      dialogUrl,
      { height: 60, width: 30, promptBeforeOpen: false },
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          reject(new Error(`Dialog failed: ${result.error.message}`));
          return;
        }
        const dialog = result.value;
        dialog.addEventHandler(Office.EventType.DialogMessageReceived, (arg: any) => {
          dialog.close();
          try {
            const message = JSON.parse(arg.message);
            if (message.status === 'success') {
              resolve(message.token);
            } else {
              reject(new Error(message.error || 'Auth dialog failed'));
            }
          } catch {
            reject(new Error('Invalid dialog response'));
          }
        });
        dialog.addEventHandler(Office.EventType.DialogEventReceived, (arg: any) => {
          reject(new Error(`Dialog event: ${arg.error}`));
        });
      }
    );
  });
}
