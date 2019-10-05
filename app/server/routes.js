const querystring = require('querystring');
const debug = require('debug')('info');
const request = require('request');
const qs = require('qs');
const axios = require("axios");
const appConfig = require('config');
const _ = require('lodash');
const ROOT_URL = appConfig.get('root_url');
const uuidv4 = require('uuid/v4');
const {promisify} = require('util');
const redis = require("redis");
const redisClient = redis.createClient();
const redisGetAsync = promisify(redisClient.get).bind(redisClient);

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
		
		const error_description = req.query.error_description;
		const state = req.query.state || uuidv4();
		const debug = req.query.debug || 0;
		const debug_info = req.query.debug_info;
		
		res.render('login', {
			ROOT_URL: ROOT_URL,
			page_title: page_title,
			state: state,
			phone_number: req.query.phone_number,
			error_message: req.query.error,
			error_description: error_description,
			debug: debug,
			debug_info: debug_info
		});
		
	});

	app.get('/authentication', (req, res) => {
		
		
		const nonce = uuidv4();
		const state = req.query.state;
		const debug = req.query.debug;
		const phone = req.query.phone;

		const redirectClientURL = `${ROOT_URL}/ipification/${debug}/callback`;

		let params = {
			response_type: 'code',
			scope: 'openid',
			client_id: client_id,
			redirect_uri: redirectClientURL,
			state: state,
			nonce: `${nonce}:${phone}`,
			login_hint: phone
		};
		redisClient.set(`${state}_phone`, phone, 'EX', 5);
		let authUrl = `${auth_server_url}/realms/${realm_name}/protocol/openid-connect/auth?` + querystring.stringify(params);
		console.log("auth url: ", authUrl)
		res.redirect(authUrl);

	})

	// 381692023534

	app.get('/ipification/:debug/callback', async function(req, res){
		const state = req.query.state;
		const debug = req.params.debug;

		console.log('---> debug', debug);

		const redirectClientURL = `${ROOT_URL}/ipification/${debug}/callback`;

		let tokenEndpointURL = auth_server_url + '/realms/' + realm_name + '/protocol/openid-connect/token';

		if(req.query.error){
			console.log(req.query.error)
			const phone_number = await redisGetAsync(`${state}_phone`);
			res.redirect(`${HomeURL}?state=${state}&phone_number=${phone_number}&error_description=${req.query.error}&error=invalid phone number`);
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
			console.log('---> requestBody', requestBody);
			const tokenResponse = await axios.post(tokenEndpointURL, qs.stringify(requestBody), config)
			console.log('---> token data: ', tokenResponse.data);
			const { access_token } = tokenResponse.data;
			const token_encode = access_token.split('.')[1];
			const ascii = Buffer.from(token_encode, 'base64').toString('ascii');
			const token_info = JSON.parse(ascii);
			const {phone_number_verified, nonce} = token_info;
			const nonce_info = nonce.split(':');
			const phone_number = nonce_info[1];

			const debug_info = JSON.stringify({
				phone_number_verified: phone_number_verified,
			});

			if(!phone_number_verified){
				const params = {
					state: state,
					phone_number: phone_number,
					error: 'invalid phone number'
				}

				if(debug == 1) params.debug_info = debug_info;

				const url = HomeURL + '?' + querystring.stringify(params);
				res.redirect(url);
				return;
			}

			const response = {
				ROOT_URL: ROOT_URL,
				page_title: page_title,
				home_url: HomeURL,
				phone_number: phone_number,
				state: state
			}

			if(debug == 1) response.debug_info = debug_info;

			console.log('---> response', response)

			res.render('result', response)

		} catch (err) {
			const phone_number = await redisGetAsync(`${state}_phone`);
			res.redirect(`${HomeURL}?phone_number=${phone_number}&error_description=${err.message}`);
		}

		
	})

	
	app.get('*', function(req, res) { 
		res.redirect(`${ROOT_URL}/login`);
	});

};
