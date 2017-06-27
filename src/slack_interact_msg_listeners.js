/**
 * Created by Sam Taha.
 */
"use strict";

import HelpIntentCB from './intent/HelpIntentCB.js';
import InteractTestIntentCB from './intent/InteractTestIntentCB.js';

export default function setupSlackInteractMsgListeners(slackInteractiveMessages, getClientByTeamId, apiai)
{
	InteractTestIntentCB.registerInteractiveMsgHandler(slackInteractiveMessages, getClientByTeamId, apiai);
	HelpIntentCB.registerInteractiveMsgHandler(slackInteractiveMessages, getClientByTeamId, apiai);
}