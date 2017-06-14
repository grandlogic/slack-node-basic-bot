/* jshint node: true, devel: true */
'use strict';

require('import-export');

const express = require('express');
const slackEventsApi = require('@slack/events-api');
const slackInteractiveMessagesApi = require('@slack/interactive-messages');
const SlackAPI = require('@slack/client');
const util = require('util');
const request = require('request');
const	apiai = require('apiai');
const	rest = require('node-rest-client');

import ExpressSetup from './ExpressSetup.js';
import SlackEventListener from './SlackEventListener.js';
import setupSlackInteractMsgListeners from './slack_interact_msg_listeners.js';

const bot_util = require('./bot_util.js');


// Start setting this up// Load environment variables from `.env` file (optional)
require('dotenv').config();
const appConfig = process; // "process" is local to the module 'dotenv'

const url = appConfig.env.SLACK_BOT_DM_WEBHOOK_URL || ''; //see section above on sensitive data
const inWebhook = new SlackAPI.IncomingWebhook(url);

const appai = apiai(process.env.APIAI_TOKEN);

//This will print to log details of the object in json
//console.log(util.inspect(message.subtype, {showHidden: false, depth: null}));

// *** Initialize event adapter using verification token from environment variables ***
const slackEvents = slackEventsApi.createSlackEventAdapter(process.env.SLACK_EVENT_INTERACTIVE_MSG_VERIFICATION_TOKEN, {
  includeBody: true
});

// Token is to verify that events and messages are coming from Slack
const slackInteractiveMessages = slackInteractiveMessagesApi.createMessageAdapter(process.env.SLACK_EVENT_INTERACTIVE_MSG_VERIFICATION_TOKEN);

const passport = bot_util.createPassport(process.env.SLACK_CLIENT_ID, process.env.SLACK_CLIENT_SECRET);

// Setup the Express web server
const httpPort = process.env.HTTP_PORT || 3000;
const expressApp = new ExpressSetup(express, slackEvents, slackInteractiveMessages, inWebhook, passport, httpPort);
expressApp.startExpress();

// *** Attach Slack event listeners ***
const slackEventListeners = new SlackEventListener(slackEvents, bot_util.getClientByTeamId, appai);
slackEventListeners.registerListeners();

setupSlackInteractMsgListeners(slackInteractiveMessages, bot_util.getClientByTeamId, appai);