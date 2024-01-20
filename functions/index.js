const functions = require("firebase-functions");
const admin = require("firebase-admin")

admin.initializeApp()


exports.pushNotification = functions.database.ref('/chats/{chatId}/messages/{id}').onCreate((snap, context) => {
    console.log('Push notification event triggered');

    //  Get the current value of what was written to the Realtime Database.
    const valueObject = snap.val();

    const sentTo = valueObject.sentTo;
    const sentBy = valueObject.sentBy;

    const name = admin.database().ref(`/status/${sentBy}/name`).once('value');
    const token = admin.database().ref(`/status/${sentTo}/token`).once('value');

    Promise.all([name, token]).then(async (values) => {

        const token = values[1].val();

        if (token == null) return { error: "No token" };
        // Create a notification
        const payload = {
            token: token,
            notification: {
                title: values[0].val(),
                body: valueObject.message,
            }
        };

        try {
            const response = await admin.messaging().send(payload);
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
            return { success: true };
        } catch (error) {
            console.log('error', error);
            return { error: error.code };
        }
    });
});
