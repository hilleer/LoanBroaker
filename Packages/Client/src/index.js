let express = require('express');
let router = express.Router();
let producer = require('./producer');
let consumer = require('./consumer');
let messageMap = require('./messageMap');

/* GET home page. */
router.get('/', function (req, res, next) {
	let endpoints =
		[
			{
				endpoint: '/loanRequest', method: 'POST', type: 'json', required: {
					ssn: 'string',
					loanAmount: 'number',
					loanDuration: 'number'
				}
			},
			{ endpoint: '/loanResponse', method: 'GET', response: 'json' }
		];

	res.json(endpoints);
});

router.post('/loanRequest', (req, res, next) => {
	let ssn = req.body.ssn;
	let loanAmount = req.body.loanAmount;
	let loanDuration = req.body.loanDuration;

	// If any of the values are undefined
	if (!ssn || !loanAmount || !loanDuration) {
		throw new Error('Undefined value(s)');
	}

	// Check if ssn already in map
	if (messageMap.mapHasKey(ssn)) {
		return res.json({ error: 'ssn already requested loans' });
	} else {
		let request = {
			ssn,
			loanAmount,
			loanDuration
		};

		producer.main(request)
			.then(() => {
				let response = {
					status: 'success',
					sent: {
						ssn,
						loanAmount,
						loanDuration
					}
				};
				return res.json({ response });
			}, (err) => {
				throw new Error(err);
			});
	}
});

router.get('/loanResponse', (req, res, next) => {
	consumer.main()
		.then((message) => {
			let key = message.content.ssn;
			messageMap.deleteKey(key);

			res.json({ status: 'success', message: message.content.toString() });
		});
});

module.exports = router;
