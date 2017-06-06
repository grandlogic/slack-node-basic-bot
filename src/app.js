/* jshint node: true, devel: true */
'use strict';

// Load environment variables from `.env` file (optional)
require('dotenv').config();

const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const slackEventsApi = require('@slack/events-api');
const slackInteractiveMessagesApi = require('@slack/interactive-messages');
const SlackAPI = require('@slack/client');
const passport = require('passport');
const SlackStrategy = require('@aoberoi/passport-slack').default.Strategy;
const util = require('util');
const request = require('request');
const	apiai = require('apiai');
const	rest = require('node-rest-client');

const mysql = require('mysql');

const SlackClient = SlackAPI.WebClient; //Slack Web API client

const url = process.env.SLACK_BOT_DM_WEBHOOK_URL || ''; //see section above on sensitive data
const inWebhook = new SlackAPI.IncomingWebhook(url);

const appai = apiai(process.env.APIAI_TOKEN);

const pool  = mysql.createPool({
	connectionLimit : process.env.MYSQL_CON_LIMIT || 5,
	host     : process.env.MYSQL_HOST,
	user     : process.env.MYSQL_USER,
	password : process.env.MYSQL_PASS,
	database : process.env.MYSQL_SCHEMA,
	port     : process.env.MYSQL_PORT || 3306
});

//This will print to log details of the object in json
//console.log(util.inspect(message.subtype, {showHidden: false, depth: null}));

// *** Initialize event adapter using verification token from environment variables ***
const slackEvents = slackEventsApi.createSlackEventAdapter(process.env.SLACK_EVENT_INTERACTIVE_MSG_VERIFICATION_TOKEN, {
  includeBody: true
});

// Token is to verify that events and messages are coming from Slack
const slackInteractiveMessages = slackInteractiveMessagesApi.createMessageAdapter(process.env.SLACK_EVENT_INTERACTIVE_MSG_VERIFICATION_TOKEN);

// Initialize a data structures to store team authorization info (typically stored in a database)
// Holds authorization token to allow bot to talk with teams
// This is done during add to slack process.
// Each token should be saved by the bot to avoid going through add to slack process after restart.
const botAuthorizations = {};

// Helpers to cache and lookup appropriate client
// NOTE: Not enterprise-ready. if the event was triggered inside a shared channel, this lookup
// could fail but there might be a suitable client from one of the other teams that is within that
// shared channel.
const clients = {};

function getClientByTeamId(teamId, callback) {
  if (!clients[teamId] && botAuthorizations[teamId]) {
    clients[teamId] = new SlackClient(botAuthorizations[teamId]);
  }
  if (clients[teamId]) {
    return callback(clients[teamId]);
  }

  // Try to load it from the DB (needed after bot restart). If it is not there then give error.
	fetchBotAccessToken(teamId, (token) => {
		if (token) {
			botAuthorizations[teamId] = token; //extra.bot.accessToken;
			clients[teamId] = new SlackClient(token);
			return callback(clients[teamId]);
		}

		// This can happen if bot (for given teamId) has never granted a bot token or if the bot
		// token was changed for some reason.
		console.log("No msg auth found for this team. Bot needs to be granted extra.bot.accessToken");
		callback(null);
	});
}

// Initialize Add to Slack (OAuth) helpers
passport.use(new SlackStrategy(
	{
		// Secret is sent to Slack as part of oauth access request to
		// get the bot/team access token.
	  clientID: process.env.SLACK_CLIENT_ID,
	  clientSecret: process.env.SLACK_CLIENT_SECRET,
	  skipUserProfile: true,
	},
	(accessToken, scopes, team, extra, profiles, done) => {

		// This access token is to what Slack will recognize per team to verify request
		// came from the correct team/bot context when SlackClient is used.
    botAuthorizations[team.id] = extra.bot.accessToken;

    console.log("SlackStategy called");
		console.log("scopes: " + util.inspect(scopes, {showHidden: false, depth: null}));
		console.log("team: " + util.inspect(team, {showHidden: false, depth: null}));
		console.log("extra: " + util.inspect(extra, {showHidden: false, depth: null}));
		console.log("profiles: " + util.inspect(profiles, {showHidden: false, depth: null}));

		// Save bot token to DB for given team.
    saveBotAccessToken(team.id, extra.bot.accessToken, done);

    //console.log("initializing oauth helpers, extra.bot.accessToken: " + extra.bot.accessToken);
    //done(null, {});
	}
));

// Initialize an Express application
const app = express();
app.use(bodyParser.json());

// Plug the Add to Slack (OAuth) helpers into the express app
app.use(passport.initialize());

// Renders the "Add to Slack" button
app.get('/', (req, res) => {
	console.log("Add to Slack / reached");
  res.send('<a href="/auth/slack"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" ' +
	            'srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>');
});

// When visited, starts oauth and redirects back to Slack website to request
// that the team admin user grant the bot access to the team.
// The callback below is invoked once the team admin user gives their authorization.
app.get('/auth/slack',
	passport.authenticate('slack', {scope: ['bot', 'incoming-webhook']}),
	(req, res) => {
		console.log("/auth/slack called");
	},
	(err, req, res, next) => {
		console.log("/auth/slack error");
	}
);

// Called when "Add to Slack" authorizing action is triggered
app.get('/auth/slack/callback',
  passport.authenticate('slack', { session: false }),
  (req, res) => {
		console.log("Success installing Greet * React");
    res.send('<p>Greet and React was successfully installed on your team.</p>');
  },
  (err, req, res, next) => {
	  console.log("Failed installing Greet * React");
	  res.status(500).send(`<p>Greet and React failed to install</p> <pre>${err}</pre>`);
  }
);

app.get('/test/bot_dm_webhook',
	(req, res) => {
		console.log("test webhook called");

		let msg = {};

		let attachments2 = [
			{
				pretext: "Oh, here is some attach pretext",
				text: "Here is some attachment text"

			}];

		msg.text= 'Hello there. This is sent from bot DM webhook with attachments';
		msg.attachments = attachments2;

		inWebhook.send(msg, function(err, resp) {
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

// *** Plug the event adapter into the express app as middleware ***
app.use('/slack/events', slackEvents.expressMiddleware());

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/slack/actions', slackInteractiveMessages.expressMiddleware());

// *** Attach listeners to the event adapter ***

// *** Greeting any user that says "hi" ***
slackEvents.on('message', (message, body) => {
  // Only deal with messages that have no subtype (plain messages) and contain 'hi'

	//console.log("message: " + util.inspect(message, {showHidden: false, depth: null}));
	//console.log("body: " + util.inspect(body, {showHidden: false, depth: null}));

	if (!message.subtype) { //This "IF" filters out the bot's own replies. Will be blank when a real user, and "bot_message" when the bots replies

		// Initialize/Find a client
		getClientByTeamId(body.team_id, (slack) => {
			// Handle initialization failure
			if (!slack) {
				return console.error('No authorization found for this team. Did you install this app again after restarting?');
			}
			// Respond to the message back in the same channel
			handleConversation(slack, message);
		});
	}
  //else {
	//	console.log("Got something: " + message.text);
	//}
});

// *** Responding to reactions with the same emoji ***
slackEvents.on('reaction_added', (event, body) => {
  // Initialize a client
  getClientByTeamId(body.team_id, (slack) => {
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
slackEvents.on('error', (error) => {
  if (error.code === slackEventsApi.errorCodes.TOKEN_VERIFICATION_FAILURE) {
    // This error type also has a `body` propery containing the request body which failed verification.
	  console.log("An unverified request was sent to the Slack events...");
    console.error(`An unverified request was sent to the Slack events Request URL. Request body: \
${JSON.stringify(error.body)}`);
  } else {
    console.error(`An error occurred while handling a Slack event: ${error.message}`);
  }
});

// Attach action handlers by `callback_id`
slackInteractiveMessages.action('welcome_action', (payload) => {
	// `payload` is JSON that describes an interaction with a message.
	console.log(`The user ${payload.user.name} in team ${payload.team.domain} pressed the welcome button`);

	// The `actions` array contains details about the particular action (button press, menu selection, etc.)
	const action = payload.actions[0];
	console.log(`The button had name ${action.name} and value ${action.value}`);

	// You should return a value which describes a message to replace the original.
	// Note that the payload contains a copy of the original message (`payload.original_message`).
	const replacement = payload.original_message;
	// Typically, you want to acknowledge the action and remove the interactive elements from the message
	replacement.text =`Welcome ${payload.user.name}`;
	delete replacement.attachments[0].actions;
	return replacement;
});

// Start the express application
const port = process.env.HTTP_PORT || 3000;
http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});

function fetchBotAccessToken(teamId, resultCB) {

	pool.getConnection(function(err, connection) {
		connection.query('SELECT * FROM bot_token WHERE team_id = ?', [teamId], function (error, results, fields) {
			// Handle error after the release.
			if (error)
			{
				connection.release();
				throw error;
			}
			if(results.length == 0) {
				console.log("bot access token NOT in the db");
				connection.release();
				resultCB(null);
			}
			console.log("bot access token from db: " + results[0].access_token);
			connection.release();
			resultCB(results[0].access_token);

		});
	});

}

// Perform an update in case team id is already present
// If no rows updated perform an insert
function saveBotAccessToken(teamId, botAccessToken, done) {

	console.log("teamId: " + teamId + " , botAccessToken: " + botAccessToken);

	pool.getConnection(function(err, connection) {
		// Update the access token for team id
		connection.query('UPDATE bot_token SET access_token = ? WHERE team_id = ?', [botAccessToken, teamId], function (error, results, fields) {
			// Handle error after the release.
			if (error)
			{
				connection.release();
				throw error;
			}

			// If no rows affected perform create record
			if(results.affectedRows == 0)
			{
				let data  = {team_id: teamId, access_token: botAccessToken};
				let query = connection.query('INSERT INTO bot_token SET ?', data, function (error, results, fields) {
					connection.release();
					if (error) throw error;
					console.log("Bot access token inserted");

					console.log("initializing oauth helpers, botAccessToken: " + botAccessToken);
					done(null, {});
				});
			}
			else {
				connection.release();
				console.log("Bot access token updated");

				console.log("initializing oauth helpers, botAccessToken: " + botAccessToken);
				done(null, {});
			}

		});
	});

}

function handleConversation(slack, message) {
	console.log('Got a Hi msg from: ' + `${message.user}` + '. Will respond now...');

	if(message.text.startsWith('action'))
	{
		let msgText = "Would you like to play a game?";

		let opts = {};

		let attachments1 = [
		{
			text: "Choose a game to play",
			fallback: "You are unable to choose a game",
			callback_id: "welcome_action",
			color: "#3AA3E3",
			attachment_type: "default",
			actions: [
				{
					name: "game",
					text: "Chess",
					type: "button",
					value: "chess"
				},
				{
					name: "game",
					text: "Falken\'s Maze",
					type: "button",
					value: "maze"
				},
				{
					name: "game",
					text: "Thermonuclear War",
					style: "danger",
					type: "button",
					value: "war",
					confirm: {
						title: "Are you sure?",
						text: "Wouldn\'t you prefer a good game of chess?",
						ok_text: "Yes",
						dismiss_text: "No"
					}
				}
			]
		}];

		let attachments2 = [
			{
				pretext: "some attach pretext",
				text: "some attachment text"

			}];

		//console.log(attachments2);

		opts.attachments=attachments1;

		slack.chat.postMessage(message.channel, msgText, opts).catch(console.error);
	}
	else {
		handle_NLP_response_message(slack, message);
		//slack.chat.postMessage(message.channel, 'Hello <@' + `${message.user}` + '>! :tada:').catch(console.error);
	}

}

function handle_NLP_response_message(slack, message) {

	console.log('user utterance: ' + message.text);

	let appaiRequest = appai.textRequest(message.text, {sessionId: '123abc'});

	appaiRequest.on('response', function (response)
	{
		let messageData = {};

		console.log(response);

		if (response.result.score < .70) {
			console.log('score too low: ' + response.result.score);
			console.log('closest matching intent action: ' + response.result.action);
			slack.chat.postMessage(message.channel, 'Yikes <@' + `${message.user}` + '>! Not following - say again. :confounded:').catch(console.error);
		}
		else { //handle the cases with a matching INTENT
			console.log('score: ' + response.result.score);
			console.log('intent_action: ' + response.result.action);
			switch(response.result.action) {
				case 'input.unknown': ///////////////////////
					slack.chat.postMessage(message.channel, 'Sorry <@' + `${message.user}` + '>! I did not get that. :confounded:').catch(console.error);
					break;
				case 'hi_response_action': ///////////////////////
					slack.chat.postMessage(message.channel, response.result.fulfillment.speech).catch(console.error);
					break;

				default: //////////////////DEFAULT
					console.log('intent_action: ' + response.result.action);
					slack.chat.postMessage(message.channel, 'Oops <@' + `${message.user}` + '>! Say what? :grin:').catch(console.error);
			}

		}
	});

	appaiRequest.on('error', function(error) {
		console.log(error);
	});

	appaiRequest.end();
}
