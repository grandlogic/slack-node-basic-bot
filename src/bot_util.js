/**
 * Created by tahas on 6/12/17.
 */
'use strict';

const SlackAPI = require('@slack/client');
const SlackClient = SlackAPI.WebClient; //Slack Web API client
const passport = require('passport');
const SlackStrategy = require('@aoberoi/passport-slack').default.Strategy;
const bot_db_access = require('./db_bot_access.js');
const util = require('util');

// Initialize a data structures to store team authorization info (typically stored in a database)
// Holds authorization token to allow bot to talk with teams
// This is done during add to slack process.
// Each token should be saved by the bot to avoid going through add to slack process after restart.
const botAuthorizations = {};

// Helpers to cache and lookup appropriate client
// NOTE: Not enterprise-ready. if the event was triggered inside a shared channel, this lookup
// could fail but there might be a suitable client from one of the other teams that is within that
// shared channel.
const slackClients = {};

// Load all the access tokens and teams upfront
bot_db_access.loadAllBotTokens(botAuthorizations, ()=> {
	console.log("done loading the db for access tokens");
});

export function getClientByTeamId(teamId, callback) {
	if (!slackClients[teamId] && botAuthorizations[teamId]) {
		slackClients[teamId] = new SlackClient(botAuthorizations[teamId]);
	}
	if (slackClients[teamId]) {
		if(callback === undefined)
			return slackClients[teamId];
		else
			return callback(slackClients[teamId]);
	}

	if(callback === undefined)
		throw "getClientByTeamId callback is required to be defined if we get to here.";


	// Try to load it from the DB (needed after bot restart). If it is not there then give error.
	bot_db_access.fetchBotAccessToken(teamId, (token) => {
		if (token) {
			botAuthorizations[teamId] = token; //extra.bot.accessToken;
			slackClients[teamId] = new SlackClient(token);
			return callback(slackClients[teamId]);
		}

		// This can happen if bot (for given teamId) has never granted a bot token or if the bot
		// token was changed for some reason.
		console.log("No msg auth found for this team. Bot needs to be granted extra.bot.accessToken");
		callback(null);
	});
}

export function test()
{
	console.log("test");
}

export function createPassport(slack_client_id, slack_client_secret)
{
	// Initialize Add to Slack (OAuth) helpers
	passport.use(new SlackStrategy(
		{
			// Secret is sent to Slack as part of oauth access request to
			// get the bot/team access token.
			clientID: slack_client_id,
			clientSecret: slack_client_secret,
			skipUserProfile: true,
		},
		(accessToken, scopes, team, extra, profiles, done) => {

			// This access token is to what Slack will recognize per team to verify request
			// came from the correct team/bot context when SlackClient is used.
			botAuthorizations[team.id] = extra.bot.accessToken;

			console.log("SlackStrategy called");
			console.log("scopes: " + util.inspect(scopes, {showHidden: false, depth: null}));
			console.log("team: " + util.inspect(team, {showHidden: false, depth: null}));
			console.log("extra: " + util.inspect(extra, {showHidden: false, depth: null}));
			console.log("profiles: " + util.inspect(profiles, {showHidden: false, depth: null}));

			// Save bot token to DB for given team.
			bot_db_access.saveBotAccessToken(team.id, extra.bot.accessToken, done);

			//console.log("initializing oauth helpers, extra.bot.accessToken: " + extra.bot.accessToken);
			//done(null, {});
		}
	));

	return passport;
}