# A basic Slack bot demonstrating the various Slack APIs

There are a number frameworks for building Slack bots such as botkit and beepboop. But
sometimes you just want to use the native Slack APIs and build your bot without the added
burden of a complex bot application framework. If this sounds like what you are looking for,
then you have come to the right place.

This project demonstrates how to apply the essential Slack APIs using the keep it simple principle and
a straight forward approach to extending and customizing your bot's
 conversational dialog and interactive UX (interactive buttons/menus).

Slack has an extensive set of APIs for building user-to-bot conversational UI
and interactive messaging applications. This project implements
a bare minimal bot application written in node
that provides a template for integrating with the various Slack APIs.
This is a starting point application for building your bot that can be thought
of as a basic modular template and set of coding patterns for building a Slack bot that
exercises the essential Slack APIs and bot interaction features.

Support for api.ai is included for demonstration purposes, but
other NLP services can be used instead.

The focus of the project is to make it easier to implement
 NLP intents and conversational bot/user interactions
and the associated UI interactions that might come about from the use
of Slack attachments (such as Slack interactive message buttons and interactive message menus).
Adding new NLP intents and handling the callbacks for interactive UI elements are
demonstrated in this basic bot. Examples for using incoming webhooks and slash
commands are also provided.

The hope is this project will make it easier to start building a Slack bot by providing a template on
which you can extend your bot with new dialog/conversations and interactions. The coding
patterns will hopefully make it easy to extend the conversational user interaction when building
 your bot.

By design, this bot uses the Slack Event API and avoids any use of the Slack RTM API.

Note, that this bot was not designed to work with Slack Enterprise Grid. Some minor
modifications would be required to have it work in a cross team enterprise environment.

Slack APIs demonstrated in this bot application:
* Event API (subscribes to: "message.im" and "reaction_added").
* Sending Text/Attachment/Interactive Messages via channel reply.
* Sending Text/Attachment/Interactive Messages via Incoming Webhook.
* Handling Slash commands.
* Handling Interactive Message actions.
* Handling oauth.access to store and use bot access token.

In addition to the core Slack REST APIs, this app demonstrates how to use the
following slack wrapper APIs:
* @slack/client
* @slack/events-api
* @slack/interactive-messages
* @aoberoi/passport-slack

## Setting up your environment:

To get started you will need to configure the ".env" file. To do this create a Slack team and setup
all the necessary configurations and set then corresponding properties in the
".env" file. See the ".env" file for all the necessary properties. They should
be self descriptive.

Next, setup a basic API.ai account and have it handle the "Hello" intent. Call the intent action "hello_action".
You will need this intent/action to test the simple conversation
examples built into the bot. You can add/modify the conversational scenarios
by following the coding patterns for adding NLP conversational intents.

You will also need a mysql database table to store the bot access token for your Slack team. The app
saves/reads from this table automatically during the "Add to Slack" handshake
and when the app is started. Here is the table DDL:

```
CREATE TABLE bot_token
(
  team_id VARCHAR(64),
  access_token VARCHAR(64),

  PRIMARY KEY bot_token_pk (team_id)
);
```

## Building and running the app:
npm install

npm start

## Testing the app:

Invoke the URI: https://my_server.ngrok.io/auth/slack to authorize the bot to integrate
with your Slack team and exchange the bot access token. This essentially takes you
through the "Add to Slack" handshake between Slack and your bot, in order to integrate your
bot with Slack.

Note, in order to test the bot, go to your Slack team and from the bot DM channel
send the message "Hi". The bot will respond with a simply reply.

Even if you do not have api.ai setup, you can send a special test message to the bot
and get a response. From the bot channel send the message "_test action".
The bot will respond with an interactive message. Click on the buttons
to see the bot respond to the actions.

To verify the incoming webhook is working invoke the
URI: https://my_server.ngrok.io/test/bot_dm_webhook to have the bot send an incoming webhook message.

The Slash command "/cancel" is supported in this bot. Make sure to register this Slash
command in the Slack admin team setup. See the "slash_commands.js" file for the exact
URI to configure.

## How to extend and customize your bot. Follow the patterns described here and shown in the source code.

## Adding new Conversations
Adding new conversations starts with adding the intents/actions in API.ai. Then
go to the "src/intent" directory and create/add a new XyzIntent.js class and if necessary
create a XyzIntentCB.js class (if the intent action generates interactive messages that
need callback handling). Look at the example intents and follow along.

Then add the intent to the "route_nlp.js" file (follwow the patterns shown).
Then if necessary register the new intent in the "slack_interact_msg_listeners.js" file (if the
 intent requires interactive messaging callbacks).

## Interactive Messaging Button/Menu
If your intent requires interactive messages or interactive menus you can handle the callbacks in the
XyzIntentCB.js file (as already mentioned above).

## Slash Commands
Slash commands can be simply registered in the "slash_commands.js" file once they are added
to the Slack team.

## Incoming Webhooks (messages sent from bot --> Slack)
If you have need to invoke out of stream notifications to send to Slack (directly and asynchronously from your
bot). See the example for incoming webhook in the file "ExpressSetup.js".

## Handling different kinds of Events
If you need to support other advanced Slack events, register them in the "SlackEventListeners.js" class.

## That is it
If you follow the above conventions and the simple patterns in the code
you can build a robust bot for your Slack team and utilize all the major Slack APIs, while
at the same time keeping the code modular and with good separation of concerns. Best of luck
with your Slack bot!
