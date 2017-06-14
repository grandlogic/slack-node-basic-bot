/**
 * Created by tahas on 6/7/17.
 */
"use strict";

const http = require('http');
const bodyParser = require('body-parser');
import register_slash_commands from './slash_commands.js';

export default class ExpressSetup {

	constructor(express, slackEvents, slackInteractiveMessages, inWebhook, passport, httpPort) {
		this.slackEvents = slackEvents;
		this.express = express;
		this.slackInteractiveMessages = slackInteractiveMessages;
		this.inWebhook = inWebhook;
		this.passport = passport;
		this.httpPort = httpPort;
	}

	toString() {
		return `${this.name} `
	}

	startExpress()
	{
		// Initialize an Express application
		const appExpress = this.express();
		appExpress.use(bodyParser.json());

		// Plug the Add to Slack (OAuth) helpers into the express app
		appExpress.use(this.passport.initialize());

		// *** Plug the event adapter into the express app as middleware ***
		appExpress.use('/slack/events', this.slackEvents.expressMiddleware());

		appExpress.use(bodyParser.urlencoded({extended: false}));
		appExpress.use('/slack/actions', this.slackInteractiveMessages.expressMiddleware());

		// Start the express application
		http.createServer(appExpress).listen(this.httpPort, () => {
			console.log(`server listening on port ${this.httpPort}`);
		});

		// Renders the "Add to Slack" button
		appExpress.get('/', (req, res) => {
			console.log("Add to Slack / reached");
			res.send('<a href="/auth/slack"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" ' +
				'srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>');
		});

		// When visited, starts oauth and redirects back to Slack website to request
		// that the team admin user grant the bot access to the team.
		// The callback below is invoked once the team admin user gives their authorization.
		appExpress.get('/auth/slack',
			this.passport.authenticate('slack', {scope: ['bot', 'incoming-webhook']}),
			(req, res) => {
				console.log("/auth/slack called");
			},
			(err, req, res, next) => {
				console.log("/auth/slack error");
			}
		);

		// Called when "Add to Slack" authorizing action is triggered
		appExpress.get('/auth/slack/callback',
			this.passport.authenticate('slack', {session: false}),
			(req, res) => {
				console.log("Success installing Greet * React");
				res.send('<p>Greet and React was successfully installed on your team.</p>');
			},
			(err, req, res, next) => {
				console.log("Failed installing Greet * React");
				res.status(500).send(`<p>Greet and React failed to install</p> <pre>${err}</pre>`);
			}
		);

		register_slash_commands(appExpress, this.inWebhook);

		// Hit this URI to test slack webhook in action. Make sure you have webhook URL
		// registered in slack and set in env properties file.
		appExpress.get('/test/bot_dm_webhook',
			(req, res) => {
				console.log("test webhook called");

				let msg = {};

				let attachments2 = [
					{
						pretext: "Oh, here is some attach pretext",
						text: "Here is some attachment text"

					}];

				msg.text = 'Hello there. This is sent from bot DM webhook with attachments';
				msg.attachments = attachments2;

				this.inWebhook.send(msg, function (err, resp) {
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
}