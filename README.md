# A basic slack node bot demonstrating various slack APIs

Slack APIs used:
* Event API (subscribes to: "message.im" and "reaction_added")
* Sending Text/Attachment/Interactive Messages via channel reply
* Sending Text/Attachment/Interactive Messages via Incoming Webhook
* Handling Interactive Message actions
* Handling oauth.access to store and use bot access token

This app uses the following slack wrapper APIs:
* @slack/client
* @slack/events-api
* @slack/interactive-messages
* @aoberoi/passport-slack

## Installation:

To get started configure the .env file.

You will need a mysql database table to store bot access token. The app
saves/reads from this table automatically during the "Add to Slack" handshake
and when the app is started:

```
CREATE TABLE bot_token
(
  team_id VARCHAR(64),
  access_token VARCHAR(64),

  PRIMARY KEY bot_token_pk (team_id)
);
```

A small workaround:
The Slack npm module @slack/interactive-messages (v0.1.1) is not working properly from the npm repository. So
you need to build the git repo in your local development environment and link to it from your local filesystem.
See the package.json for details. The git project is here: https://github.com/slackapi/node-slack-interactive-messages.
Download it and reference it from your package.json using the local file path.

## Node setup and running the app:
npm install
npm start

## Testing the app:

Invoke the URI: https://my_server.ngrok.io/auth/slack to give the bot is access token.

From the bot channel send the message "Hi". The bot will respond with a simply reply.

From the bot channel send the message "action". The bot will respond with a interactive message. Click on the buttons
to see the bot respond to the actions.

Invoke the URI: https://my_server.ngrok.io/test/bot_dm_webhook
To have the bot send a incoming webhook message.

To use the simple api.ai integration, send the message "What is going on" and have it return
a corresponding message from your api.ai account.
