const querystring = require('querystring');
const debug = require('debug')('info');
const request = require('request');
const qs = require('qs');
const axios = require("axios");
const appConfig = require('config');
const _ = require('lodash');
const ROOT_URL = appConfig.get('root_url');
const uuidv4 = require('uuid/v4');

const auth_server_url = appConfig.get('auth-server-url');
const realm_name = appConfig.get('realm');
const client_id = appConfig.get('client_id');
const client_secret = appConfig.get('client_secret');
const page_title = appConfig.get('page_title');

const HomeURL = `${ROOT_URL}/login`;

module.exports = function(app) {

	app.get('/', function(req, res){
		res.redirect(HomeURL);
	})

	// main login page //
	app.get('/login', async (req, res) => {
		
		res.render('login', {
			ROOT_URL: ROOT_URL,
			page_title: page_title
		});
		
	});

	app.get('/authentication', (req, res) => {
		const redirectClientURL = `${ROOT_URL}/ipification/callback`;
		const state = uuidv4();
		const nonce = uuidv4();
		const phone = req.query.phone

		let params = {
			response_type: 'code',
			scope: 'openid',
			client_id: client_id,
			redirect_uri: redirectClientURL,
			state: state,
			nonce: `${nonce}:${phone}`,
			login_hint: phone
		};

		let authUrl = `${auth_server_url}/realms/${realm_name}/protocol/openid-connect/auth?` + querystring.stringify(params);
		res.redirect(authUrl);

	})

	app.get('/ipification/callback', async function(req, res){
		
		const redirectClientURL = `${ROOT_URL}/ipification/callback`;

		let tokenEndpointURL = auth_server_url + '/realms/' + realm_name + '/protocol/openid-connect/token';
		let userEndpointURL = auth_server_url + '/realms/' + realm_name + '/protocol/openid-connect/userinfo';

		if(req.query.error){
			console.log(req.query)
			res.redirect(`${HomeURL}?error=${req.query.error}`);
			return;
		}

		let requestBody = {
			code: req.query.code,
			redirect_uri: redirectClientURL,
			grant_type: 'authorization_code',
			client_id: client_id,
			client_secret: client_secret
		};

		const config = {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}

		try {
			const tokenResponse = await axios.post(tokenEndpointURL, qs.stringify(requestBody), config)
			const { access_token } = tokenResponse.data;
			const userResponse = await axios.post(userEndpointURL, qs.stringify({access_token: access_token}))
			const data = userResponse.data;

			debug('token endpoint data: %o', data);

			res.render('result', {
				ROOT_URL: ROOT_URL,
				page_title: page_title,
				home_url: HomeURL,
				phone_number: data.phone_number
			})

		} catch (err) {
			console.error(err);
			res.redirect(HomeURL);
		}

		
	})

	
	app.get('*', function(req, res) { 
		res.redirect(`${ROOT_URL}/login`);
	});

};
