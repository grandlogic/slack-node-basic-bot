/**
 * Created by tahas on 6/7/17.
 */
"use strict";

export default function register_slash_commands(appExpress, inWebhook) {

	// Slash command "/cancel" invokes this url and sends reply back via incoming webhook
	appExpress.post('/test/bot_slash_cmd',
		(req, res) => {
			console.log("CANCEL slack slash command");

			let msg = {};

			let attachments2 = [
				{
					pretext: "Cancel some stuff",
					text: "Oh, are you sure you want to cancel stuff?"

				}];

			msg.text = 'I will cancel some stuff for you.';
			msg.attachments = attachments2;

			inWebhook.send(msg, function (err, resp) {
				if (err) {
					console.log('Error:', err);
				} else {
					console.log('Message sent: ', res);
				}
			});
			res.status(200).send("Success. Msg sent!");
		},
		(err, req, res, next) => {
			console.log("test webhook error");
		}
	);
}

