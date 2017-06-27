/**
 * Created by Sam Taha.
 */
"use strict";

const mysql = require('mysql');

require('dotenv').config();
const appConfig = process; // "process" is local to the module 'dotenv'

const pool = mysql.createPool({
	connectionLimit: appConfig.env.MYSQL_CON_LIMIT || 5,
	host: appConfig.env.MYSQL_HOST,
	user: appConfig.env.MYSQL_USER,
	password: appConfig.env.MYSQL_PASS,
	database: appConfig.env.MYSQL_SCHEMA,
	port: appConfig.env.MYSQL_PORT || 3306
});

export function loadAllBotTokens(bot_token_list, resultCB) {
	pool.getConnection(function(err, connection) {
		connection.query('SELECT * FROM bot_token', function (error, results, fields) {
			// Handle error after the release.
			if (error)
			{
				connection.release();
				throw error;
			}
			let ii=0;
			for(ii = 0; ii< results.length; ii++) {
				bot_token_list[results[ii].team_id] = results[ii].access_token;
				console.log("loading bot access token from db: " + results[ii].team_id + " | " + results[ii].access_token);
			}
			connection.release();
			resultCB();
		});
	});
}

export function fetchBotAccessToken(teamId, resultCB) {

	pool.getConnection(function(err, connection) {
		connection.query('SELECT * FROM bot_token WHERE team_id = ?', [teamId], function (error, results, fields) {
			// Handle error after the release.
			if (error)
			{
				connection.release();
				throw error;
			}
			if(results.length === 0) {
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
export function saveBotAccessToken(teamId, botAccessToken, done) {

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
			if(results.affectedRows === 0)
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