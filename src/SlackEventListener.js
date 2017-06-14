/**
 * Created by tahas on 6/7/17.
 */
"use strict";

const util = require('util');
import handleConversation from './route_nlp.js';

const slackEventsApi = require('@slack/events-api');

export default class SlackEventListener {

	constructor(slackEvents, getClientByTeamId, appai) {
		this.slackEvents = slackEvents;
		this.getClientByTeamId = getClientByTeamId;
		this.appai = appai;
	}

	registerListeners()
	{
		// *** Greeting any user that says "hi" ***
		this.slackEvents.on('message', (message, body) => {
			// Only deal with messages that have no subtype (plain messages) and contain 'hi'

			//console.log("message: " + util.inspect(message, {showHidden: false, depth: null}));
			//console.log("body: " + util.inspect(body, {showHidden: false, depth: null}));

			if (!message.subtype) { //This "IF" filters out the bot's own replies. Will be blank when a real user, and "bot_message" when the bots replies
				console.log("message:: " + util.inspect(message, {showHidden: false, depth: null}));
				console.log("body:: " + util.inspect(body, {showHidden: false, depth: null}));
				// Initialize/Find a client
				this.getClientByTeamId(body.team_id, (slack) => {
					// Handle initialization failure
					if (!slack) {
						return console.error('No authorization found for this team. Did you install this app again after restarting?');
					}
					// Respond to the message back in the same channel
					handleConversation(this.appai, slack, message.text, message.channel, message.user);
				});
			}
			else {
				console.log("message IGNORE:: " + util.inspect(message, {showHidden: false, depth: null}));
				console.log("body IGNORE:: " + util.inspect(body, {showHidden: false, depth: null}));
			}
		});

		// *** Responding to reactions with the same emoji ***
		this.slackEvents.on('reaction_added', (event, body) => {
			// Initialize a client
			this.getClientByTeamId(body.team_id, (slack) => {
				// Handle initialization failure
				if (!slack) {
					console.log("No reaction_added auth found for this team");
					return console.error('No authorization found for this team. Did you install this app again after restarting?');
				}
				// Respond to the reaction back with the same emoji
				console.log('Emoji reaction');
				slack.chat.postMessage(event.item.channel, `Right back at you dude... :${event.reaction}:`).catch(console.error);
			});
		});

		// *** Handle errors ***
		this.slackEvents.on('error', (error) => {
			if (error.code === slackEventsApi.errorCodes.TOKEN_VERIFICATION_FAILURE) {
				// This error type also has a `body` propery containing the request body which failed verification.
				console.log("An unverified request was sent to the Slack events...");
				console.error(`An unverified request was sent to the Slack events Request URL. Request body: ${JSON.stringify(error.body)}`);
			} else {
				console.error(`An error occurred while handling a Slack event: ${error.message}`);
			}
		});
	}
}
