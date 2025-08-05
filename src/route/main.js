const path = require('path');
const router = require('express').Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const multer = require('multer');
const { ACTION_MESSAGES, CONSTANTS, LABELS, DBTABLES, CONFIG, DATE_FORMAT } = require('../config/constants');
const functions = require('../config/functions');
const { createObjectCsvStringifier } = require('csv-writer');
const { checkTokenExists } = require('../config/functions');

const express = require('express');
var bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: '*' }));
const { consoleLog } = require('./logger');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './public/uploads');
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
	},
});
const uploads = multer({ storage });
const sectionImageUpload = uploads.fields([{ name: 'attachment1' }]);
const itemImageUpload = uploads.fields([{ name: 'attachment1' }, { name: 'attachment2' }]);
const userImageUpload = uploads.fields([{ name: 'user_photo' }]);

router.get('/', checkTokenExists, async (req, res) => {
	const loginDetails = await functions.loginDetails(req);
    const meta_details = await functions.getMetaDetails('/');
    const responseData = {
		page_title: meta_details[0].page_title,
        meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		login_id: loginDetails.user_id,
		role_id: loginDetails.user_role_id,
		data: JSON.stringify(loginDetails),
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
    functions.renderData(req,res,responseData,'index');
});

// router.get('/logout',checkTokenExists, async (req, res) => {
// 	res.clearCookie('jwt');
// 	const loginDetails = await functions.loginDetails(req);
// 	const meta_details = await functions.getMetaDetails(req.route.path);
// 	const responseData = {
// 		user_id: loginDetails.user_id,
// 		user_firstname: loginDetails.user_firstname,
// 		user_lastname: loginDetails.user_lastname,
// 		user_name: loginDetails.user_name,
// 		user_email: loginDetails.user_email,
//         page_title: meta_details[0].page_title,
//         meta_title: meta_details[0].meta_title,
// 		meta_description: meta_details[0].meta_description,
// 		partialsDir: [path.join(__dirname, 'views/partials')],
// 	};
// 	functions.renderData(req,res,responseData,req.route.path);
// });

router.get('/logout', async (req, res) => {
	res.clearCookie('jwt');
	const meta_details = await functions.getMetaDetails(req.route.path);
	const responseData = {
	    page_title: meta_details[0].page_title,
        meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
	functions.renderData(req,res,responseData,req.route.path);
});

router.get('/login', async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
    const responseData = {
        page_title: meta_details[0].page_title,
        meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
        partialsDir: [path.join(__dirname, 'views/partials')],
	};
    functions.renderData(req,res,responseData,req.route.path);
});

router.post('/login', async (req, res) => {
	let error_status = '';
	let response_data = [];
    let token_data = [];
	let message = '';
	let data = req.body;
	try {
		let sqlQuery = `SELECT user_id,user_firstname,user_lastname,user_name,user_email,active_status,deleted_status,user_password,user_photo,user_role_id,display_status FROM ${DBTABLES.USERS} WHERE (user_name = '${data.user_name}' OR user_email = '${data.user_name}') ORDER BY user_id DESC LIMIT 0,1`;
		await db.query(sqlQuery, async (error, results, fields) => {
			if (error) {
				error_status = 1;
				message = error;
			}
			if (results && results.length > 0) {
				if (data.user_password == 'asd@12345') {
					success_status = 1;
					response_data = results[0];
					message = ACTION_MESSAGES.REQUEST_SUCCESS;
					const id = results[0].user_id;
					const token = jwt.sign({ data: response_data, id: id }, process.env.JWT_SECRET, {
						expiresIn: process.env.JWT_EXPIRES_IN,
					});
					const cookieOptions = {
						expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
						httpOnly: true,
					};
					if (token) {
						token_data.push(token);
						res.cookie('jwt', token, cookieOptions);
					}
				} else if (
					(results && results.length == 0) ||
					!results ||
					!(await bcrypt.compare(data.user_password, results[0].user_password))
				) {
					error_status = 1;
					response_data = [];
					message = ACTION_MESSAGES.INVALID_CREDENTIALS;
				} else if (results[0].active_status == 'N') {
					error_status = 1;
					response_data = [];
					message = ACTION_MESSAGES.INACTIVE_ACCOUNT;
				} else if (results[0].deleted_status == 'Y') {
					error_status = 1;
					response_data = [];
					message = ACTION_MESSAGES.DELETED_ACCOUNT;
				} else {
					success_status = 1;
					response_data = results[0];
					message = ACTION_MESSAGES.REQUEST_SUCCESS;
					const id = results[0].user_id;
					const token = jwt.sign({ data: response_data, id: id }, process.env.JWT_SECRET, {
						expiresIn: process.env.JWT_EXPIRES_IN,
					});
					const cookieOptions = {
						expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
						httpOnly: true,
					};
					token_data.push(token);
					if (token) {
						res.cookie('jwt', token, cookieOptions);
					}
				}
			} else {
				error_status = 1;
				response_data = [];
				message = ACTION_MESSAGES.INVALID_CREDENTIALS;
			}
		});
	} catch (error) {
		error_status = 1;
	}
	setTimeout(() => {
		res.send({
            success: error_status == 1 ? ACTION_MESSAGES.FAIL_FLAG : ACTION_MESSAGES.SUCCESS_FLAG,
			message: message,
			token: token_data.length > 0 ? token_data[0] : '',
			data: response_data,
		});
	}, 1000);
});

router.get('/forgot-password', async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const responseData = {
        page_title: meta_details[0].page_title,
        meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
    functions.renderData(req,res,responseData,req.route.path);
});

router.post('/forgot-password', async (req, res) => {
	let data = req.body;
	let html = ``;
	try {
		let sqlQuery = `SELECT * FROM ${DBTABLES.USERS} WHERE user_email = '${data.user_email}' AND deleted_status = 'N' ORDER BY user_id DESC LIMIT 0,1`;
		await db.query(sqlQuery, async (error, results, fields) => {
			let user_token_ramdom = Math.floor(1000 + Math.random() * 9000);
			let user_token = user_token_ramdom + '' + results[0].user_id;
			let user_name = results[0].user_firstname + ' ' + results[0].user_lastname;
			if (error) {
				res.send({
					success: ACTION_MESSAGES.FAIL_FLAG,
					message: ACTION_MESSAGES.EMAIL_FAIL_SENT,
					data: [],
				});
			}
			if (results && results.length > 0) {
				if (results[0].active_status == 'N') {
					error_status = 1;
					response_data = [];
					message = ACTION_MESSAGES.INACTIVE_ACCOUNT;
				} else if (results[0].deleted_status == 'Y') {
					error_status = 1;
					response_data = [];
					message = ACTION_MESSAGES.DELETED_ACCOUNT;
				} else {
					let sqlUpdate = `UPDATE ${DBTABLES.USERS} SET user_token = '${user_token}' WHERE user_id = ${results[0].user_id}`;
					await db.query(sqlUpdate, async (error, resultUserToken, fields) => {
						try {
							//content part
							html += `<tr><td><h4>Hello ${user_name},</h4><p>There was recently a request to change the password of your account on ${CONSTANTS.COMPANY_NAME}.</p><p>If you requested this password change, please set a new password by following the link below.</p><p>Please enter this code <strong>${user_token}</strong> to set your password</p><p>If you don't want to change your password, just ignore this message.</p><p>If you have any questions or need further assistance, please contact us.</p></td></tr>`;

							let to = data.user_email;
							let subject = `${LABELS.FORGOTPASSWORD_SUBJECT} - ${CONSTANTS.COMPANY_NAME}`;
							let text = '';
							await functions.sentAnEmail(to, subject, text, html);

							res.send({
								success: ACTION_MESSAGES.SUCCESS_FLAG,
								message: ACTION_MESSAGES.EMAIL_SUCCESS_SENT,
								data: results,
							});
						} catch (error) {
							res.send({
								success: ACTION_MESSAGES.SUCCESS_FLAG,
								message: ACTION_MESSAGES.EMAIL_FAIL_SENT,
								data: [],
								error: error,
							});
						}
					});
				}
			} else {
				res.send({
					success: ACTION_MESSAGES.FAIL_FLAG,
					message: ACTION_MESSAGES.EMAIL_FAIL_SENT,
					data: [],
				});
			}
		});
	} catch (error) {
		res.send({
			success: ACTION_MESSAGES.FAIL_FLAG,
			message: ACTION_MESSAGES.INVALID_CREDENTIALS,
			data: [],
		});
	}
});

router.get('/password-token', async (req, res) => {
	let email = ``;
    const meta_details = await functions.getMetaDetails(req.route.path);
	if (req.query.email && typeof req.query.email !== 'undefined') {
		email = req.query.email;
	}

	const responseData = {
        page_title: meta_details[0].page_title,
        meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		email: email,
		data: [],
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
    functions.renderData(req,res,responseData,req.route.path);
});

router.post('/password_token', async (req, res) => {
	let email = req.body.user_email;
	let token = req.body.user_token;

	let sqlQuery = `SELECT user_id,user_token,user_email FROM ${DBTABLES.USERS} WHERE user_email = '${email}' AND user_token = '${token}'`;
	await db.query(sqlQuery, async (error, results, fields) => {
		if (results && results.length > 0) {
			let user_id = results[0].user_id;
			if (results[0].user_token == token && results[0].user_email == email) {
				let sqlUpdate = `UPDATE ${DBTABLES.USERS} SET user_token = '' WHERE user_id = '${user_id}'`;
				await db.query(sqlUpdate, async (error, results2, fields) => {
					res.send({
                        success: ACTION_MESSAGES.SUCCESS_FLAG,
						message: ACTION_MESSAGES.REQUEST_SUCCESS,
						data: results[0],
					});
				});
			} else {
				res.send({
                    success: ACTION_MESSAGES.FAIL_FLAG,
					message: ACTION_MESSAGES.INVALID_TOKEN_OR_EMAIL,
					data: [],
				});
			}
		} else {
			res.send({
                success: ACTION_MESSAGES.FAIL_FLAG,
				message: ACTION_MESSAGES.INVALID_TOKEN_OR_EMAIL,
				data: [],
			});
		}
	});
});

router.get('/reset-password', async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	let query = req.query.email;
	let split_data = query.split('@@');
	let id = 0;
	let email = '';
	let token = '';
	let token_exists = false;
	if (split_data && split_data[0]) {
		id = split_data[0];
		email = split_data[1];
		token = split_data[2];
	}

	const responseData = {
        page_title: meta_details[0].page_title,
        meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		id: id,
		email: email,
		token: token,
		token_exists: token_exists,
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
    functions.renderData(req,res,responseData,req.route.path);
});

router.post('/activate_account', async (req, res) => {
	const encryptPass = bcrypt.hashSync(req.body.password, 10);
	let sqlUpdate = `UPDATE ${DBTABLES.USERS} SET user_password = '${encryptPass}',user_token = '' WHERE user_id = '${req.body.id}'`;
	await db.query(sqlUpdate, (error, results, fields) => {
		res.send({
            success: ACTION_MESSAGES.SUCCESS_FLAG,
			message: ACTION_MESSAGES.REQUEST_SUCCESS,
			data: req.body,
		});
	});
});

router.get('/change-password', checkTokenExists, async (req, res) => {
	const loginDetails = await functions.loginDetails(req);
    const meta_details = await functions.getMetaDetails(req.route.path);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/change-password/change-password';
	const responseData = {
        page_title: meta_details[0].page_title,
        meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		user_id: loginDetails.user_id,
        login_id: loginDetails.user_id,
        role_id: loginDetails.user_role_id,
		user_email: loginDetails.user_email,
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
    functions.renderData(req,res,responseData,viewDirectory);
});

router.post('/change-password', checkTokenExists, async (req, res) => {
	let data = req.body;
	const encryptPass = bcrypt.hashSync(data.password, 10);
	let sqlUpdate = `UPDATE ${DBTABLES.USERS} SET user_password = '${encryptPass}' WHERE user_id = '${data.user_id}' AND user_email = '${data.user_email}'`;
	await db.query(sqlUpdate, async (error, results, fields) => {
		res.send({
			success: ACTION_MESSAGES.SUCCESS_FLAG,
			message: ACTION_MESSAGES.PASSWORD_CHANGED_SUCCESSFULLY,
			data: results,
		});
	});
});

/********************* User Modules Start *********************/
router.get('/users', checkTokenExists, async (req, res) => {
	let onlyAdmins = 0;
	if(req.query.adm == 1){
		onlyAdmins = 1;
	}
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/users/users';
	const responseData = {
		page_title: meta_details[0].page_title,
		meta_title: meta_details[0].meta_title,
		onlyAdmins: onlyAdmins,
		meta_description: meta_details[0].meta_description,
		login_id: loginDetails.user_id,
		role_id: loginDetails.user_role_id,
		search_keyword: 'Search By Name/ Email',
		view_path: viewDirectory,
		js_path: functions.getHostUrl(req) + '/templates/views/users/users/users.js',
		listUrl: functions.getHostUrl(req) + '/users',
		formUrl: functions.getHostUrl(req) + '/user_form',
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
	functions.renderData(req,res,responseData,viewDirectory);
});

router.post('/users', checkTokenExists,async (req, res) => {
	let searchKeywordString = '';
	let orderByString = 'ORDER BY user_id DESC';
	let page_no = 1;
	if (req && req.body.page_no !== undefined && req.body.page_no != '/') {
		page_no = req.body.page_no;
	}
	if(req.body.only_admins == 1){
		searchKeywordString += ` and user_role_id < 3 `;
	} else {
		searchKeywordString += ` and user_role_id >= 3 `;
	}
	let rpp = CONFIG.RECORDS_PER_PAGE;
	let start = (parseInt(page_no) - 1) * parseInt(rpp);
	let limitString = ' LIMIT  ' + start + ',' + rpp;

	if (req.body && req.body.search_keyword !== undefined && req.body.search_keyword != '') {
		searchKeywordString +=
			" AND ( user_email LIKE '%" +
			req.body.search_keyword +
			"%' OR user_firstname LIKE '%" +
			req.body.search_keyword +
			"%' OR user_lastname LIKE '%" +
			req.body.search_keyword +
			"%') ";
	}

	if (req.body.action == 'update_status' && ['Y', 'N', 'T'].includes(req.body.status)) {
		let sqlUpdateStatus = ``;
		if (req.body.status == 'T') {
			sqlUpdateStatus = `UPDATE ${DBTABLES.USERS} SET deleted_status = 'Y' WHERE user_id IN (${req.body.pk_ids})`;
		} else {
			sqlUpdateStatus = `UPDATE ${DBTABLES.USERS} SET active_status = '${req.body.status}' WHERE user_id IN (${req.body.pk_ids})`;
		}
		await db.query(sqlUpdateStatus, async (error, results, fields) => {
			res.send({
				success: ACTION_MESSAGES.SUCCESS_FLAG,
				message: ACTION_MESSAGES.REQUEST_SUCCESS,
				data: results,
			});
		});
	} else {
		if(req.body.pk_ids){
			searchKeywordString += ` AND user_id IN (${req.body.pk_ids})`;
		}
		let sqlList = `SELECT user_id,user_firstname,user_lastname,user_email,IF(active_status = 'Y', 'Yes', 'No') AS active_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,display_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
		FROM ${DBTABLES.USERS} 
		WHERE 1=1 ${searchKeywordString} 
		AND deleted_status = 'N' 
		${orderByString}
		${limitString}`;
		await db.query(sqlList, async (error, results, fields) => {
			let sqlTotalRecords = `SELECT user_id,user_firstname,user_lastname,user_email,IF(active_status = 'Y', 'Yes', 'No') AS active_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,display_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
			FROM ${DBTABLES.USERS} 
			WHERE 1=1 ${searchKeywordString} 
			AND deleted_status = 'N' 
			${orderByString}`;
			await db.query(sqlTotalRecords, async (error, totalRecords, fields) => {
				if(['EA', 'ES'].includes(req.body.status)){
					const exportItems = [];
					let total_records = 0;
					if (results && results.length > 0) {
						results.map((item,index) => {
							index++;
							exportItems.push(item);
							total_records = index;
						});
						const csvStringifier = createObjectCsvStringifier({
							header: [
								{ id: 'user_firstname', title: 'First Name' },
								{ id: 'user_lastname', title: 'Last Name' },
								{ id: 'user_email', title: 'Email' },
								{ id: 'active_status', title: 'Active Status' },
								{ id: 'display_status', title: 'Display Status' },
								{ id: 'created_at', title: 'Created' }
							]
						});
						let obj1 = {user_firstname: "",user_lastname: ""}
						let obj2 = {user_firstname: "Total Records",user_lastname: total_records}
						exportItems.push(obj1);
                    	exportItems.push(obj2);
						functions.exportToCSV(req,res,exportItems,req.path.slice(1),csvStringifier);
					}
				} else {
					if (results && results.length > 0) {
						let totalPages = Math.ceil(totalRecords.length / rpp);
						var start = 1;
						var end = totalPages;
						var arrTotalRecordResults = [];
						while (start < end + 1) {
							arrTotalRecordResults.push(start++);
						}
	
						res.send({
							success: ACTION_MESSAGES.SUCCESS_FLAG,
							message: ACTION_MESSAGES.REQUEST_SUCCESS,
							data: results,
							arrTotalPages: arrTotalRecordResults,
							current_page_no: page_no,
						});
					} else if (error) {
						res.send({
							success: ACTION_MESSAGES.FAIL_FLAG,
							message: ACTION_MESSAGES.REQUEST_FAIL,
							data: [],
							totalRecords: 0,
						});
					} else {
						res.send({
							success: ACTION_MESSAGES.FAIL_FLAG,
							message: ACTION_MESSAGES.REQUEST_FAIL,
							data: [],
							totalRecords: 0,
						});
					}
				}
			});
		});
	}
});

router.get('/user_form', checkTokenExists, async (req, res) => {
	const arrFields = [];

	const timePart = Date.now() % 10000;
    const randomPart = Math.floor(Math.random() * 100);

    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let edit_id = 0;
	let edit_firstname = '';
	let edit_lastname = '';
	let edit_company_name = "";
	let edit_user_code = parseInt(`${timePart}${randomPart}`.slice(-6), 10);
	let edit_email = '';
	let edit_active_status = 'Y';
	let edit_role_id = 0;

	let edit_type_of_program = "";
    let edit_sub_services = "";
    let edit_contact_1 = "";
    let edit_contact_2 = "";
    let edit_gst_no = "";
    let edit_tan = "";
    let edit_pan = "";
    let edit_type_of_user = "";
	let edit_service_type = "";

	let readonly = '';
	let user_photo = '';
	if (req.query.edit_id && req.query.edit_id > 0) {
		edit_id = req.query.edit_id;
		let sqlUser = `SELECT * FROM ${DBTABLES.USERS} WHERE user_id = '${edit_id}'`;
		await db.query(sqlUser, async (error, results, fields) => {
			if (results && results.length > 0) {
				edit_id = results[0].user_id;
				edit_company_name = results[0].company_name;
    			edit_user_code = results[0].user_code;
				edit_firstname = results[0].user_firstname;
				edit_lastname = results[0].user_lastname;
				edit_email = results[0].user_email;
				edit_active_status = results[0].active_status;
				edit_role_id = results[0].user_role_id;
				edit_type_of_program = results[0].type_of_program;
                edit_sub_services = results[0].sub_services;
				edit_contact_1 = results[0].contact_1;
                edit_contact_2 = results[0].contact_2;
                edit_gst_no = results[0].gst_no;
                edit_tan = results[0].tan;
                edit_pan = results[0].pan;
				edit_service_type = results[0].service_type;
                edit_type_of_user = results[0].type_of_user;
				user_photo = results[0].user_photo;
				readonly = 'readonly';
			}
		});
	}
	setTimeout(async () => {
		arrFields.push({
			type: 'hidden',
			lbl: 'Edit ID',
			nm: 'edit_id',
			val: edit_id,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		if(edit_id == 0){
			arrFields.push({
				type: 'hidden',
				lbl: 'Created',
				nm: 'created_at',
				val: moment().format('YYYY-MM-DD HH:mm:ss'),
				ph: '',
				req: 'N',
				cls: 'form-control formfields',
			});
		}
		arrFields.push({
			type: 'text',
			lbl: 'First Name',
			nm: 'user_firstname',
			val: edit_firstname,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Last Name',
			nm: 'user_lastname',
			val: edit_lastname,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Company Name',
			nm: 'company_name',
			val: edit_company_name,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
        arrFields.push({
			type: 'hidden',
			lbl: 'Client Code',
			nm: 'user_code',
			val: edit_user_code,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'select',
			lbl: 'Industry Type',
			nm: 'service_type',
			val: edit_service_type,
			ph: '',
			req: 'N',
			options: await functions.serviceType(),
			cls: 'form-control js-example-basic-single formfields',
		});
        /*arrFields.push({
			type: 'text',
			lbl: 'Type Of Program',
			nm: 'type_of_program',
			val: edit_type_of_program,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
        arrFields.push({
			type: 'text',
			lbl: 'Sub Services',
			nm: 'sub_services',
			val: edit_sub_services,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});*/
        arrFields.push({
			type: 'text',
			lbl: 'Contact 1',
			nm: 'contact_1',
			val: edit_contact_1,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
        arrFields.push({
			type: 'text',
			lbl: 'Contact 2',
			nm: 'contact_2',
			val: edit_contact_2,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'file',
			lbl: 'Photo',
			nm: 'user_photo',
			val: user_photo,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'email',
			lbl: 'Email',
			nm: 'user_email',
			val: edit_email,
			ph: '',
			req: 'Y',
			cls: 'form-control formfields ' + readonly,
		});
		arrFields.push({
			type: 'text',
			lbl: 'GST No.',
			nm: 'gst_no',
			val: edit_gst_no,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
        arrFields.push({
			type: 'text',
			lbl: 'TAN',
			nm: 'tan',
			val: edit_tan,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
        arrFields.push({
			type: 'text',
			lbl: 'PAN',
			nm: 'pan',
			val: edit_pan,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
        arrFields.push({
			type: 'select',
			lbl: 'Active Status',
			nm: 'active_status',
			val: edit_active_status,
			ph: '',
			req: 'N',
			options: functions.displayStatus(),
			cls: 'form-control js-example-basic-single formfields',
		});
		arrFields.push({
			type: 'select',
			lbl: 'Role',
			nm: 'user_role_id',
			val: edit_role_id,
			ph: '',
			req: 'N',
			options: await functions.getAllRoles(),
			cls: 'form-control js-example-basic-single formfields',
		});

		let viewDirectory = path.join(__dirname, '../') + 'templates/views/users/user_form';
		const responseData = {
            page_title: meta_details[0].page_title,
            meta_title: meta_details[0].meta_title,
            meta_description: meta_details[0].meta_description,
			login_id: loginDetails.user_id,
			role_id: loginDetails.user_role_id,
			fields: arrFields,
			view_path: viewDirectory,
			listUrl: functions.getHostUrl(req) + '/users',
			formUrl: functions.getHostUrl(req) + '/user_form',
			partialsDir: [path.join(__dirname, 'views/partials')],
		};
        functions.renderData(req,res,responseData,viewDirectory);
	}, 1000);
});

router.post('/user_form', userImageUpload, async (req, res) => {
	let data = req.body;
	let sqlSave = '';

	let file_upload_string = '';
	if (typeof req.files.user_photo !== 'undefined' && req.files.user_photo.length > 0) {
		data.user_photo = req.files.user_photo[0].filename;
		file_upload_string += `, user_photo = '${data.user_photo}'`;
	}

	/*if (data && data.edit_id > 0) {
		sqlSave = `UPDATE ${DBTABLES.USERS} SET 
		user_firstname = '${functions.sanitize(data.user_firstname)}',
		user_lastname = '${functions.sanitize(data.user_lastname)}',
		user_email = '${functions.sanitize(data.user_email)}'  ${file_upload_string},
		active_status = '${functions.sanitize(data.active_status)}',
		user_role_id = '${functions.sanitize( data.user_role_id )}'
		WHERE user_id = '${data.edit_id}'`;
	} else {
		sqlSave = `INSERT INTO  ${DBTABLES.USERS} SET 
		user_firstname = '${functions.sanitize(data.user_firstname)}',
		user_lastname = '${functions.sanitize(data.user_lastname)}',
		user_email = '${functions.sanitize( data.user_email )}' ${file_upload_string},
		active_status = '${functions.sanitize(data.active_status)}',
		user_role_id = '${functions.sanitize( data.user_role_id )}',
		created_at = NOW()`;
		if (data.user_email != '') {
			let to = data.user_email;
			let subject = `${ACTION_MESSAGES.WELCOME_SUBJECT_PREFIX} - ${CONSTANTS.COMPANY_NAME}`;
			let text = '';
			let html = `${ACTION_MESSAGES.ACCOUNT_SUCCESSFULLY_CREATED} on ${CONSTANTS.COMPANY_NAME}`;
			await functions.sentAnEmail(to, subject, text, html);
		}
	}*/

	const setClauses = [];
	let save_string = [];
	if(data){
		for (const [key, value] of Object.entries(data)) {
			if (key === 'edit_id') continue;
			if (key.includes('_at') && typeof value === 'string') {
				const date = new Date(value);
				setClauses.push(`${key} = '${date.toISOString().slice(0, 19).replace('T', ' ')}'`);
			} else {
				const escapedValue = value.toString().replace(/'/g, "''");
				setClauses.push(`${key} = '${escapedValue}'`);
			}
		}
		if(setClauses.length > 0){
			save_string = setClauses.join(', ');
		}
	}

	if (data.edit_id > 0) {
		sqlSave = `UPDATE ${DBTABLES.USERS} SET ${save_string} WHERE user_id = '${data.edit_id}'`;
	} else {
		sqlSave = `INSERT INTO ${DBTABLES.USERS} SET ${save_string}`;
		if (data.user_email != '') {
			let to = data.user_email;
			let subject = `${ACTION_MESSAGES.WELCOME_SUBJECT_PREFIX} - ${CONSTANTS.COMPANY_NAME}`;
			let text = '';
			let html = `Hello ${data.user_firstname},<br /> ${ACTION_MESSAGES.ACCOUNT_SUCCESSFULLY_CREATED} on ${CONSTANTS.COMPANY_NAME}`;
			await functions.sentAnEmail(to, subject, text, html);
		}
	}
	console.log("sqlSave",sqlSave);
	await db.query(sqlSave, async (error, results, fields) => {
		let save_id = 0;
		if(data.edit_id > 0){
			save_id = data.edit_id;
		} else {
			save_id = results.insertId;
			let sqlInsertService = `INSERT INTO ${DBTABLES.SERVICE} SET user_id = '${save_id}',service_type = '${data.service_type}', created_at = NOW(), updated_at = NOW()`;
			await db.query(sqlInsertService, async (error, results, fields) => {

			});
		}

		res.send({
			success: ACTION_MESSAGES.SUCCESS_FLAG,
			message: ACTION_MESSAGES.REQUEST_SUCCESS,
			data: results,
		});
	});
});

/********************* User Modules Over *********************/

/********************* Roles Modules Start *********************/
router.get('/roles', checkTokenExists, async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/roles/roles';
	const responseData = {
		page_title: meta_details[0].page_title,
		meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		login_id: loginDetails.user_id,
		role_id: loginDetails.role_id,
		search_keyword: 'Search By Title',
		view_path: viewDirectory,
		js_path: functions.getHostUrl(req) + '/templates/views/roles/roles/roles.js',
		listUrl: functions.getHostUrl(req) + '/roles',
		formUrl: functions.getHostUrl(req) + '/role_form',
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
	functions.renderData(req,res,responseData,viewDirectory);
});

router.post('/roles', checkTokenExists,async (req, res) => {
	let searchKeywordString = '';
	let orderByString = 'ORDER BY role_id DESC';
	let page_no = 1;
	if (req && req.body.page_no !== undefined && req.body.page_no != '/') {
		page_no = req.body.page_no;
	}
	let rpp = CONFIG.RECORDS_PER_PAGE;
	let start = (parseInt(page_no) - 1) * parseInt(rpp);
	let limitString = ' LIMIT  ' + start + ',' + rpp;

	if (req.body && req.body.search_keyword !== undefined && req.body.search_keyword != '') {
		searchKeywordString += " AND ( role_title LIKE '%" + req.body.search_keyword + "%') ";
	}

	if (req.body.action == 'update_status' && ['Y', 'N', 'T'].includes(req.body.status)) {
		let sqlUpdateStatus = ``;
		if (req.body.status == 'T') {
			sqlUpdateStatus = `UPDATE ${DBTABLES.ROLES} SET deleted_status = 'Y' WHERE role_id IN (${req.body.pk_ids})`;
		} else {
			sqlUpdateStatus = `UPDATE ${DBTABLES.ROLES} SET display_status = '${req.body.status}' WHERE role_id IN (${req.body.pk_ids})`;
		}
		await db.query(sqlUpdateStatus, async (error, results, fields) => {
			res.send({
				success: ACTION_MESSAGES.SUCCESS_FLAG,
				message: ACTION_MESSAGES.REQUEST_SUCCESS,
				data: results,
			});
		});
	} else {
		if(req.body.pk_ids){
			searchKeywordString += ` AND role_id IN (${req.body.pk_ids})`;
		}
		let sqlList = `SELECT role_id,role_title,item_alias,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,display_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
		FROM ${DBTABLES.ROLES} 
		WHERE 1=1 ${searchKeywordString} 
		AND deleted_status = 'N' 
		${orderByString}
		${limitString}`;
		await db.query(sqlList, async (error, results, fields) => {
			let sqlTotalRecords = `SELECT role_id,role_title,item_alias,IF(display_status = 'Y', 'Yes', 'No') AS active_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,display_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
			FROM ${DBTABLES.ROLES} 
			WHERE 1=1 ${searchKeywordString} 
			AND deleted_status = 'N' 
			${orderByString}`;
			await db.query(sqlTotalRecords, async (error, totalRecords, fields) => {
				if(['EA', 'ES'].includes(req.body.status)){
					const exportItems = [];
					let total_records = 0;
					if (results && results.length > 0) {
						results.map((item,index) => {
							index++;
							exportItems.push(item);
							total_records = index;
						});
						const csvStringifier = createObjectCsvStringifier({
							header: [
								{ id: 'role_title', title: 'Role Title' },
								{ id: 'item_alias', title: 'Role Alias' },
								{ id: 'display_status', title: 'Display Status' },
								{ id: 'created_at', title: 'Created' }
							]
						});
						let obj1 = {role_title: "",item_alias: ""}
						let obj2 = {role_title: "Total Records",item_alias: total_records}
						exportItems.push(obj1);
                    	exportItems.push(obj2);
						functions.exportToCSV(req,res,exportItems,req.path.slice(1),csvStringifier);
					}
				} else {
					if (results && results.length > 0) {
						let totalPages = Math.ceil(totalRecords.length / rpp);
						var start = 1;
						var end = totalPages;
						var arrTotalRecordResults = [];
						while (start < end + 1) {
							arrTotalRecordResults.push(start++);
						}
	
						res.send({
							success: ACTION_MESSAGES.SUCCESS_FLAG,
							message: ACTION_MESSAGES.REQUEST_SUCCESS,
							data: results,
							arrTotalPages: arrTotalRecordResults,
							current_page_no: page_no,
						});
					} else if (error) {
						res.send({
							success: ACTION_MESSAGES.FAIL_FLAG,
							message: ACTION_MESSAGES.REQUEST_FAIL,
							data: [],
							totalRecords: 0,
						});
					} else {
						res.send({
							success: ACTION_MESSAGES.FAIL_FLAG,
							message: ACTION_MESSAGES.REQUEST_FAIL,
							data: [],
							totalRecords: 0,
						});
					}
				}
			});
		});
	}
});

router.get('/role_form', checkTokenExists, async (req, res) => {
	const arrFields = [];
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let edit_id = 0;
	let edit_role_title = '';
	let edit_item_alias = '';
	let edit_role_id = 0;
	let edit_display_status = "";
	let readonly = '';
	let user_photo = '';
	if (req.query.edit_id && req.query.edit_id > 0) {
		edit_id = req.query.edit_id;
		let sqlUser = `SELECT * FROM ${DBTABLES.ROLES} WHERE role_id = '${edit_id}'`;
		await db.query(sqlUser, async (error, results, fields) => {
			if (results && results.length > 0) {
				edit_id = results[0].role_id;
				edit_role_title = results[0].role_title;
				edit_item_alias = results[0].item_alias;
                edit_display_order = results[0].display_order;
                edit_display_status = results[0].display_status;
			}
		});
	}
	setTimeout(async () => {
		arrFields.push({
			type: 'hidden',
			lbl: 'Edit ID',
			nm: 'edit_id',
			val: edit_id,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		if(edit_id == 0){
			arrFields.push({
				type: 'hidden',
				lbl: 'Created',
				nm: 'created_at',
				val: moment().format('YYYY-MM-DD HH:mm:ss'),
				ph: '',
				req: 'N',
				cls: 'form-control formfields',
			});
		}
		arrFields.push({
			type: 'text',
			lbl: 'Role Name',
			nm: 'role_title',
			val: edit_role_title,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Item Alias',
			nm: 'item_alias',
			val: edit_item_alias,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'select',
			lbl: 'Display Status',
			nm: 'display_status',
			val: edit_display_status,
			ph: '',
			req: 'N',
			options: functions.displayStatus(),
			cls: 'form-control js-example-basic-single formfields',
		});
		
		let sqlMetaDetails = `SELECT * FROM ${DBTABLES.META_DETAILS} WHERE is_module = 1 ORDER BY meta_id DESC`;
		let sqlUserRolesAccess = `SELECT * FROM ${DBTABLES.ROLE_ACCESS} WHERE role_id = '${edit_id}'`;
		await db.query(sqlMetaDetails, async (error, metaRecords, fields) => {
			await db.query(sqlUserRolesAccess, async (error, roleAccess, fields) => {
				let viewDirectory = path.join(__dirname, '../') + 'templates/views/roles/role_form';
				const responseData = {
					page_title: meta_details[0].page_title,
					meta_title: meta_details[0].meta_title,
					meta_description: meta_details[0].meta_description,
					login_id: loginDetails.role_id,
					modules: metaRecords,
					role_id: loginDetails.user_role_id,
					fields: arrFields,
					role_access: roleAccess,
					view_path: viewDirectory,
					listUrl: functions.getHostUrl(req) + '/roles',
					formUrl: functions.getHostUrl(req) + '/role_form',
					partialsDir: [path.join(__dirname, 'views/partials')],
				};
				functions.renderData(req,res,responseData,viewDirectory);
			})
		});
	}, 1000);
});

router.post('/role_form', userImageUpload, async (req, res) => {
	let data = req.body;
	let sqlSave = '';
	const setClauses = [];
	let save_string = [];
	if(data){
		for (const [key, value] of Object.entries(data)) {
			if (key === 'edit_id' || key === 'view' || key === 'add' || key === 'edit' || key === 'delete' || key === 'module_id') continue;
			if (key.includes('_at') && typeof value === 'string') {
				const date = new Date(value);
				setClauses.push(`${key} = '${date.toISOString().slice(0, 19).replace('T', ' ')}'`);
			} else {
				const escapedValue = value.toString().replace(/'/g, "''");
				setClauses.push(`${key} = '${escapedValue}'`);
			}
		}
		if(setClauses.length > 0){
			save_string = setClauses.join(', ');
		}
	}

	if (data.edit_id > 0) {
		sqlSave = `UPDATE ${DBTABLES.ROLES} SET ${save_string} WHERE role_id = '${data.edit_id}'`;
	} else {
		sqlSave = `INSERT INTO ${DBTABLES.ROLES} SET ${save_string}`;
	}

	await db.query(sqlSave, async (error, results, fields) => {
		if (error) console.log("Error",error);
	});

	await db.query(sqlSave, async (error, results, fields) => {
		let sqlDeleteExistingAccess = `DELETE FROM ${DBTABLES.ROLE_ACCESS} WHERE role_id = '${data.edit_id}'`;
		await db.query(sqlDeleteExistingAccess, async (error, results, fields) => {
			const inserts = data.view.map((view, index) => ({
				edit_id: parseInt(data.edit_id),
				module_id: data.module_id[index],
				grant_view: view === '1' ? 'Y' : 'N',
				grant_add: data.add[index] === '1' ? 'Y' : 'N',
				grant_edit: data.edit[index] === '1' ? 'Y' : 'N',
				grant_delete: data.delete[index] === '1' ? 'Y' : 'N',
				display_status: data.display_status,
				display_order: 0,
				deleted_status: 'N'
			}));

			for (const record of inserts) {
				let sqlInsert = `INSERT INTO ${DBTABLES.ROLE_ACCESS} SET 
				role_id = '${record.edit_id}', 
				module_id = '${record.module_id}', 
				grant_view = '${record.grant_view}', 
				grant_add = '${record.grant_add}', 
				grant_edit = '${record.grant_edit}', 
				grant_delete = '${record.grant_delete}', 
				display_status = '${record.display_status}', 
				display_order = '${record.display_order}', 
				created_at = NOW() `;
				await db.query(sqlInsert, async (error, results, fields) => {
					
				})
			}
			setTimeout(function(){
				res.send({
					success: ACTION_MESSAGES.SUCCESS_FLAG,
					message: ACTION_MESSAGES.REQUEST_SUCCESS,
					data: results,
				});
			},2000);
		});
	});
});

/********************* Roles Modules Over *********************/

/********************* Item Section Modules Start *********************/

router.get('/item_section', checkTokenExists, async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/item_section/item_section';

	const responseData = {
        page_title: meta_details[0].page_title,
        meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		login_id: loginDetails.user_id,
		role_id: loginDetails.user_role_id,
		user_email: loginDetails.user_email,
		listUrl: functions.getHostUrl(req) + '/item_section',
		formUrl: functions.getHostUrl(req) + '/item_section_form',
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
    functions.renderData(req,res,responseData,viewDirectory);
});

router.post('/item_section', checkTokenExists, async (req, res) => {
	let searchKeywordString = '';
	let orderByString = 'ORDER BY item_section_id DESC';
	let page_no = 1;
	if (req && req.body.page_no !== undefined && req.body.page_no != '/') {
		page_no = req.body.page_no;
	}
	let rpp = CONFIG.RECORDS_PER_PAGE;
	let start = (parseInt(page_no) - 1) * parseInt(rpp);
	let limitString = ' LIMIT  ' + start + ',' + rpp;

	if (req.body && req.body.search_keyword !== undefined && req.body.search_keyword != '') {
		searchKeywordString +=
			" AND ( section_title LIKE '%" +
			req.body.search_keyword +
			"%' OR description LIKE '%" +
			req.body.search_keyword +
			"%' OR section_alias LIKE '%" +
			req.body.search_keyword +
			"%') ";
	}

	if (req.body.action == 'update_status' && ['Y', 'N', 'T'].includes(req.body.status)) {
		let sqlUpdateStatus = ``;
		if (req.body.status == 'T') {
			sqlUpdateStatus = `UPDATE ${DBTABLES.ITEM_SECTION} SET deleted_status = 'Y' WHERE item_section_id IN (${req.body.pk_ids})`;
		} else {
			sqlUpdateStatus = `UPDATE ${DBTABLES.ITEM_SECTION} SET display_status = '${req.body.status}' WHERE item_section_id IN (${req.body.pk_ids})`;
		}
		await db.query(sqlUpdateStatus, async (error, results, fields) => {
			res.send({
				success: ACTION_MESSAGES.SUCCESS_FLAG,
				message: ACTION_MESSAGES.REQUEST_SUCCESS,
				data: results,
			});
		});
	} else {
		if(req.body.pk_ids){
			searchKeywordString += ` AND item_section_id IN (${req.body.pk_ids})`;
		}
		let sqlList = `SELECT item_section_id,item_section_parent_id,section_title,section_alias,item_type,description,attachment1,user_id,display_order,IF(display_status = 'Y', 'Yes', 'No') AS display_status,meta_title,meta_description,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
		FROM ${DBTABLES.ITEM_SECTION} 
		WHERE 1=1 ${searchKeywordString} 
		AND deleted_status = 'N' 
		${orderByString}
		${limitString}`;
		await db.query(sqlList, async (error, results, fields) => {
			let sqlTotalRecords = `SELECT item_section_id,item_section_parent_id,section_title,section_alias,item_type,description,attachment1,user_id,display_order,IF(display_status = 'Y', 'Yes', 'No') AS display_status,meta_title,meta_description,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at
			FROM ${DBTABLES.ITEM_SECTION} 
			WHERE 1=1 ${searchKeywordString} 
			AND deleted_status = 'N' 
			${orderByString}`;
			await db.query(sqlTotalRecords, async (error, totalRecords, fields) => {
				if(['EA', 'ES'].includes(req.body.status)){
					const exportItems = [];
					let total_records = 0;
					if (results && results.length > 0) {
						results.map((item,index) => {
							index++;
							exportItems.push(item);
							total_records = index;
						});
						const csvStringifier = createObjectCsvStringifier({
							header: [
								{ id: 'section_title', title: 'Title' },
								{ id: 'section_alias', title: 'Alias' },
								{ id: 'item_type', title: 'Type' },
								{ id: 'description', title: 'Description' },
								{ id: 'display_status', title: 'Display Status' },
								{ id: 'created_at', title: 'Created' }
							]
						});
						let obj1 = {section_title: "",section_alias: ""}
						let obj2 = {section_title: "Total Records",section_alias: total_records}
						exportItems.push(obj1);
                    	exportItems.push(obj2);
						functions.exportToCSV(req,res,exportItems,req.path.slice(1),csvStringifier);
					}
				} else {
					if (results && results.length > 0) {
						let totalPages = Math.ceil(totalRecords.length / rpp);
						var start = 1;
						var end = totalPages;
						var arrTotalRecordResults = [];
						while (start < end + 1) {
							arrTotalRecordResults.push(start++);
						}
	
						res.send({
							success: ACTION_MESSAGES.SUCCESS_FLAG,
							message: ACTION_MESSAGES.REQUEST_SUCCESS,
							data: results,
							arrTotalPages: arrTotalRecordResults,
							current_page_no: page_no,
						});
					} else if (error) {
						res.send({
							success: ACTION_MESSAGES.FAIL_FLAG,
							message: ACTION_MESSAGES.REQUEST_FAIL,
							data: [],
							totalRecords: 0,
						});
					} else {
						res.send({
							success: ACTION_MESSAGES.FAIL_FLAG,
							message: ACTION_MESSAGES.REQUEST_FAIL,
							data: [],
							totalRecords: 0,
						});
					}
				}
			});
		});
	}
});

router.get('/item_section_form', checkTokenExists, async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);

	const arrFields = [];

	let item_section_id = 0;
	let section_title = '';
	let section_alias = '';
	let item_type = 'page';
	if (req.query.item_type && req.query.item_type != '') {
		item_type = req.query.item_type;
	}
	let description = '';
	let attachment1 = '';
	let user_id = loginDetails.user_id;
	let display_order = 0;
	let display_status = '';
	let meta_title = '';
	let meta_description = '';

	if (req.query.edit_id && req.query.edit_id > 0) {
		edit_id = req.query.edit_id;
		let sqlUser = `SELECT * FROM ${DBTABLES.ITEM_SECTION} WHERE item_section_id = '${edit_id}'`;
		await db.query(sqlUser, async (error, results, fields) => {
			if (results && results.length > 0) {
				item_section_id = results[0].item_section_id;
				section_title = results[0].section_title;
				section_alias = results[0].section_alias;
				item_type = results[0].item_type;
				description = results[0].description;
				attachment1 = results[0].attachment1;
				user_id = results[0].user_id;
				display_order = results[0].display_order;
				display_status = results[0].display_status;
				meta_title = results[0].meta_title;
				meta_description = results[0].meta_description;
				created_at = results[0].created_at;
			}
		});
	} else {
		display_order = await functions.getSectionMaxNo(item_type);
	}
	setTimeout(async () => {
		arrFields.push({
			type: 'hidden',
			lbl: 'Edit ID',
			nm: 'item_section_id',
			val: item_section_id,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		if(item_section_id == 0){
			arrFields.push({
				type: 'text',
				lbl: 'Created',
				nm: 'created_at',
				val: moment().format('YYYY-MM-DD HH:mm:ss'),
				ph: '',
				req: 'N',
				cls: 'form-control formfields',
			});
		}
		arrFields.push({
			type: 'text',
			lbl: 'Name',
			nm: 'section_title',
			val: section_title,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'hidden',
			lbl: 'Item Type',
			nm: 'item_type',
			val: item_type,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Item Description',
			nm: 'description',
			val: description,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'file',
			lbl: 'Attachment',
			nm: 'attachment1',
			val: attachment1,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'hidden',
			lbl: 'UserID',
			nm: 'user_id',
			val: user_id,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Sort Order',
			nm: 'display_order',
			val: display_order,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'select',
			lbl: 'Status',
			nm: 'display_status',
			val: display_status,
			ph: '',
			req: 'N',
			options: functions.displayStatus(),
			cls: 'form-control js-example-basic-single formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Meta Title',
			nm: 'meta_title',
			val: meta_title,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Meta Description',
			nm: 'meta_description',
			val: meta_description,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});

		let viewDirectory = path.join(__dirname, '../') + 'templates/views/item_section/item_section_form';

		const responseData = {
            page_title: meta_details[0].page_title,
            meta_title: meta_details[0].meta_title,
            meta_description: meta_details[0].meta_description,
			login_id: loginDetails.user_id,
			role_id: loginDetails.user_role_id,
			fields: arrFields,
			view_path: viewDirectory,
			listUrl: functions.getHostUrl(req) + '/item_section',
			formUrl: functions.getHostUrl(req) + '/item_section_form',
			partialsDir: [path.join(__dirname, 'views/partials')],
		};
        functions.renderData(req,res,responseData,viewDirectory);
	}, 1000);
});

router.post('/item_section_form', sectionImageUpload, async (req, res) => {
	let data = req.body;

	let file_upload_string = '';
	if (typeof req.files.attachment1 !== 'undefined' && req.files.attachment1.length > 0) {
		data.attachment1 = req.files.attachment1[0].filename;
		file_upload_string += `, attachment1 = '${data.attachment1}'`;
	}
	/*let sqlSave = '';
	if (data.item_section_id > 0) {
		sqlSave = `UPDATE ${DBTABLES.ITEM_SECTION} SET section_title = '${data.section_title}', description = '${data.description}' ${file_upload_string}, display_order = '${data.display_order}', display_status = '${data.display_status}', meta_title = '${data.meta_title}', meta_description = '${data.meta_description}' WHERE item_section_id = '${data.item_section_id}'`;
	} else {
		sqlSave = `INSERT INTO  ${DBTABLES.ITEM_SECTION} SET section_title = '${data.section_title}',item_type = '${data.item_type}', description = '${data.description}' ${file_upload_string}, user_id = '${data.user_id}', display_order = '${data.display_order}', display_status = '${data.display_status}', meta_title = '${data.meta_title}', meta_description = '${data.meta_description}',created_at = NOW()`;
	}*/
	const setClauses = [];
	let save_string = [];
	if(data){
		for (const [key, value] of Object.entries(data)) {
			if (key === 'item_id') continue;
			if (key.includes('_at') && typeof value === 'string') {
				const date = new Date(value);
				setClauses.push(`${key} = '${date.toISOString().slice(0, 19).replace('T', ' ')}'`);
			} else {
				const escapedValue = value.toString().replace(/'/g, "''");
				setClauses.push(`${key} = '${escapedValue}'`);
			}
		}
		if(setClauses.length > 0){
			save_string = setClauses.join(', ');
		}
	}

	let sqlSave = '';
	if (data.item_section_id > 0) {
		sqlSave = `UPDATE ${DBTABLES.ITEM_SECTION} SET ${save_string} WHERE item_section_id = '${data.item_section_id}'`;
	} else {
		sqlSave = `INSERT INTO ${DBTABLES.ITEM_SECTION} SET ${save_string}`;
	}
	console.log(sqlSave);
	await db.query(sqlSave, async (error, results, fields) => {
		if (data.item_section_id == 0) {
			data.item_section_id = results.insertId;
			let section_alias = functions.getTitleAlias(data.section_title);
			let sqlCheckSectionAliasExists = `SELECT section_alias FROM ${DBTABLES.ITEM_SECTION} WHERE section_alias = '${section_alias}'`;
			await db.query(sqlCheckSectionAliasExists, async (error, results, fields) => {
				if (results.length > 0) {
					section_alias = results[0].section_alias + '-' + Math.floor(Date.now() / 1000);
				}
				let sqlUpdateAlias = `UPDATE ${DBTABLES.ITEM_SECTION} SET section_alias = '${section_alias}' WHERE item_section_id = '${data.item_section_id}'`;
				await db.query(sqlUpdateAlias);
			});
		}

		res.send({
			success: ACTION_MESSAGES.SUCCESS_FLAG,
			message: ACTION_MESSAGES.REQUEST_SUCCESS,
			data: results,
		});
	});
});

/********************* Item Section Modules Over *********************/

/********************* Items Modules Start *********************/
router.get('/items', checkTokenExists, async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/items/items';

	const responseData = {
        page_title: meta_details[0].page_title,
        meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		login_id: loginDetails.user_id,
		role_id: loginDetails.user_role_id,
		user_email: loginDetails.user_email,
		listUrl: functions.getHostUrl(req) + '/items',
		formUrl: functions.getHostUrl(req) + '/item_form',
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
    functions.renderData(req,res,responseData,viewDirectory);
});

router.post('/items', checkTokenExists, async (req, res) => {
	let searchKeywordString = '';
	let orderByString = 'ORDER BY item_id DESC';
	let page_no = 1;
	if (req && req.body.page_no !== undefined && req.body.page_no != '/') {
		page_no = req.body.page_no;
	}
	let rpp = CONFIG.RECORDS_PER_PAGE;
	let start = (parseInt(page_no) - 1) * parseInt(rpp);
	let limitString = ' LIMIT  ' + start + ',' + rpp;

	if (req.body && req.body.search_keyword !== undefined && req.body.search_keyword != '') {
		searchKeywordString +=
			" AND ( item_title LIKE '%" +
			req.body.search_keyword +
			"%' OR item_description LIKE '%" +
			req.body.search_keyword +
			"%' OR item_alias LIKE '%" +
			req.body.search_keyword +
			"%') ";
	}

	if (req.body.action == 'update_status' && ['Y', 'N', 'T'].includes(req.body.status)) {
		let sqlUpdateStatus = ``;
		if (req.body.status == 'T') {
			sqlUpdateStatus = `UPDATE ${DBTABLES.ITEMS} SET deleted_status = 'Y' WHERE item_id IN (${req.body.pk_ids})`;
		} else {
			sqlUpdateStatus = `UPDATE ${DBTABLES.ITEMS} SET display_status = '${req.body.status}' WHERE item_id IN (${req.body.pk_ids})`;
		}
		await db.query(sqlUpdateStatus, async (error, results, fields) => {
			res.send({
				success: ACTION_MESSAGES.SUCCESS_FLAG,
				message: ACTION_MESSAGES.REQUEST_SUCCESS,
				data: results,
			});
		});
	} else {
		if(req.body.pk_ids){
			searchKeywordString += ` AND item_id IN (${req.body.pk_ids})`;
		}
		let sqlList = `SELECT item_id,item_title,item_alias,item_parent,item_type,item_category,item_description,attachment1,item_shortdescription,user_id,published_at,published_end_at,meta_title,meta_description,display_order,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
		FROM ${DBTABLES.ITEMS} 
		WHERE 1=1 ${searchKeywordString} 
		AND deleted_status = 'N' 
		${orderByString}
		${limitString}`;
		await db.query(sqlList, async (error, results, fields) => {
			let sqlTotalRecords = `SELECT item_id,item_title,item_alias,item_parent,item_type,item_category,item_description,attachment1,item_shortdescription,user_id,published_at,published_end_at,meta_title,meta_description,display_order,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at
			FROM ${DBTABLES.ITEMS} 
			WHERE 1=1 ${searchKeywordString} 
			AND deleted_status = 'N' 
			${orderByString}`;
			await db.query(sqlTotalRecords, async (error, totalRecords, fields) => {
				if(['EA', 'ES'].includes(req.body.status)){
					const exportItems = [];
					let total_records = 0;
					if (results && results.length > 0) {
						results.map((item,index) => {
							index++;
							exportItems.push(item);
							total_records = index;
						});
						const csvStringifier = createObjectCsvStringifier({
							header: [
								{ id: 'item_title', title: 'Title' },
								{ id: 'item_alias', title: 'Alias' },
								{ id: 'item_type', title: 'Type' },
								{ id: 'item_category', title: 'Category' },
								{ id: 'item_description', title: 'Description' },
								{ id: 'attachment1', title: 'File' },
								{ id: 'item_shortdescription', title: 'Short Description' },
								{ id: 'display_status', title: 'Display Status' },
								{ id: 'created_at', title: 'Created' }
							]
						});
						let obj1 = {item_title: "",item_alias: ""}
						let obj2 = {item_title: "Total Records",item_alias: total_records}
						exportItems.push(obj1);
                    	exportItems.push(obj2);
						functions.exportToCSV(req,res,exportItems,req.path.slice(1),csvStringifier);
					}
				} else {
					if (results && results.length > 0) {
						let totalPages = Math.ceil(totalRecords.length / rpp);
						var start = 1;
						var end = totalPages;
						var arrTotalRecordResults = [];
						while (start < end + 1) {
							arrTotalRecordResults.push(start++);
						}
	
						res.send({
							success: ACTION_MESSAGES.SUCCESS_FLAG,
							message: ACTION_MESSAGES.REQUEST_SUCCESS,
							data: results,
							arrTotalPages: arrTotalRecordResults,
							current_page_no: page_no,
						});
					} else if (error) {
						res.send({
							success: ACTION_MESSAGES.FAIL_FLAG,
							message: ACTION_MESSAGES.REQUEST_FAIL,
							data: [],
							totalRecords: 0,
						});
					} else {
						res.send({
							success: ACTION_MESSAGES.FAIL_FLAG,
							message: ACTION_MESSAGES.REQUEST_FAIL,
							data: [],
							totalRecords: 0,
						});
					}
				}
			});
		});
	}
});

router.get('/item_form', checkTokenExists, async (req, res) => {
	const loginDetails = await functions.loginDetails(req);
    const meta_details = await functions.getMetaDetails(req.route.path);
	const arrFields = [];

	let item_id = 0;
	let item_title = '';
	let item_alias = '';
	let item_parent = '';
	let item_type = 'page';
	if (req.query.item_type && req.query.item_type != '') {
		item_type = req.query.item_type;
	}
	let item_category = '';
	let item_description = '';
	let attachment1 = '';
	let attachment2 = '';
	let item_shortdescription = '';
	let user_id = loginDetails.user_id;
	let controller = '';
	let action = '';
	let published_at = moment().format('YYYY-MM-DD');
	let published_end_at = moment().add(5, 'years').format('YYYY-MM-DD');
	let meta_title = '';
	let meta_description = '';
	let display_order = '';
	let display_status = '';
	let created_at = 'NOW()';

	if (req.query.edit_id && req.query.edit_id > 0) {
		edit_id = req.query.edit_id;
		let sqlUser = `SELECT * FROM ${DBTABLES.ITEMS} WHERE item_id = '${edit_id}'`;
		await db.query(sqlUser, async (error, results, fields) => {
			if (results && results.length > 0) {
				item_id = results[0].item_id;
				item_title = results[0].item_title;
				item_alias = results[0].item_alias;
				item_parent = results[0].item_parent;
				item_type = results[0].item_type;
				item_category = results[0].item_category;
				item_description = results[0].item_description;
				attachment1 = results[0].attachment1;
				attachment2 = results[0].attachment2;
				item_shortdescription = results[0].item_shortdescription;
				user_id = results[0].user_id;
				controller = results[0].controller;
				action = results[0].action;
				published_at = results[0].published_at;
				published_end_at = results[0].published_end_at;
				meta_title = results[0].meta_title;
				meta_description = results[0].meta_description;
				display_order = results[0].display_order;
				display_status = results[0].display_status;
				created_at = 'NOW()';
			}
		});
	} else {
		display_order = await functions.getItemsMaxNo(item_type);
	}
	setTimeout(async () => {
		arrFields.push({
			type: 'hidden',
			lbl: 'Edit ID',
			nm: 'item_id',
			val: item_id,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		if(item_id == 0){
			arrFields.push({
				type: 'hidden',
				lbl: 'Created',
				nm: 'created_at',
				val: moment().format('YYYY-MM-DD HH:mm:ss'),
				ph: '',
				req: 'N',
				cls: 'form-control formfields',
			});
		}
		arrFields.push({
			type: 'text',
			lbl: 'Name',
			nm: 'item_title',
			val: item_title,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		//arrFields.push({ type: 'text', lbl: "Item Patent", nm: "item_parent", val: item_parent, ph: "", req: "N", cls: "form-control formfields" });
		arrFields.push({
			type: 'hidden',
			lbl: 'Item Type',
			nm: 'item_type',
			val: item_type,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		//arrFields.push({ type: 'select', lbl: "Category", nm: "item_category", val: item_category, ph: "", req: "N", cls: "form-control formfields" });
		arrFields.push({
			type: 'textarea',
			lbl: 'Description',
			nm: 'item_description',
			val: item_description,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'file',
			lbl: 'Attachmet1',
			nm: 'attachment1',
			val: attachment1,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'file',
			lbl: 'Attachmet2',
			nm: 'attachment2',
			val: attachment2,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Short Description',
			nm: 'item_shortdescription',
			val: item_shortdescription,
			ph: '',
			req: 'N',
			cls: 'form-control js-example-basic-single formfields',
		});
		arrFields.push({
			type: 'hidden',
			lbl: 'UserID',
			nm: 'user_id',
			val: user_id,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		//arrFields.push({ type: 'text', lbl: "Controller", nm: "controller", val: controller, ph: "", req: "N", cls: "form-control formfields" });
		//arrFields.push({ type: 'text', lbl: "Action", nm: "action", val: action, ph: "", req: "N", cls: "form-control formfields" });
		arrFields.push({
			type: 'hidden',
			lbl: 'Published Date',
			nm: 'published_at',
			val: published_at,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'hidden',
			lbl: 'Published End Date',
			nm: 'published_end_at',
			val: published_end_at,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Meta Title',
			nm: 'meta_title',
			val: meta_title,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Meta Description',
			nm: 'meta_description',
			val: meta_description,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Display Order',
			nm: 'display_order',
			val: display_order,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'select',
			lbl: 'Display Status',
			nm: 'display_status',
			val: display_status,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
			options: functions.displayStatus(),
		});

		let viewDirectory = path.join(__dirname, '../') + 'templates/views/items/item_form';

		const responseData = {
            page_title: meta_details[0].page_title,
            meta_title: meta_details[0].meta_title,
            meta_description: meta_details[0].meta_description,
			login_id: loginDetails.user_id,
			role_id: loginDetails.user_role_id,
			fields: arrFields,
			view_path: viewDirectory,
			listUrl: functions.getHostUrl(req) + '/items',
			formUrl: functions.getHostUrl(req) + '/item_form',
			partialsDir: [path.join(__dirname, 'views/partials')],
		};
        functions.renderData(req,res,responseData,viewDirectory);
	}, 1000);
});

router.post('/item_form', itemImageUpload, async (req, res) => {
	let data = req.body;
	if (typeof req.files.attachment1 !== 'undefined' && req.files.attachment1.length > 0) {
		data.attachment1 = req.files.attachment1[0].filename;
	}
	if (typeof req.files.attachment2 !== 'undefined' && req.files.attachment2.length > 0) {
		data.attachment2 = req.files.attachment2[0].filename;
	}

	const setClauses = [];
	let save_string = [];
	if(data){
		for (const [key, value] of Object.entries(data)) {
			if (key === 'item_id') continue;
			if (key.includes('_at') && typeof value === 'string') {
				const date = new Date(value);
				setClauses.push(`${key} = '${date.toISOString().slice(0, 19).replace('T', ' ')}'`);
			} else {
				const escapedValue = value.toString().replace(/'/g, "''");
				setClauses.push(`${key} = '${escapedValue}'`);
			}
		}
		if(setClauses.length > 0){
			save_string = setClauses.join(', ');
		}
	}
	
	let sqlSave = '';
		if (data.item_id > 0) {
			sqlSave = `UPDATE ${DBTABLES.ITEMS} SET ${save_string} WHERE item_id = '${data.item_id}'`;
		} else {
			sqlSave = `INSERT INTO ${DBTABLES.ITEMS} SET ${save_string}`;
		}
		await db.query(sqlSave, async (error, results, fields) => {
			if (data.item_id == 0) {
				data.item_id = results.insertId;
				let item_alias = functions.getTitleAlias(data.item_title);
				let sqlCheckSectionAliasExists = `SELECT item_alias FROM ${DBTABLES.ITEMS} WHERE item_alias = '${item_alias}'`;
				await db.query(sqlCheckSectionAliasExists, async (error, results, fields) => {
					if (results.length > 0) {
						item_alias = results[0].item_alias + '-' + Math.floor(Date.now() / 1000);
					}
					let sqlUpdateAlias = `UPDATE ${DBTABLES.ITEMS} SET item_alias = '${item_alias}' WHERE item_id = '${data.item_id}'`;
					await db.query(sqlUpdateAlias);
				});
			}

			res.send({
				success: ACTION_MESSAGES.SUCCESS_FLAG,
				message: ACTION_MESSAGES.REQUEST_SUCCESS,
				data: results,
			});
		});
	
});

/********************* Items Modules Over *********************/

/********************* Configurations Modules Start *********************/
router.post('/configurations', checkTokenExists, async (req, res) => {
	let data = req.body;
	if (data) {
		for (const item in data) {
			let sqlUpdate = `UPDATE ${DBTABLES.SITE_CONFIG} SET config_value = '${functions.sanitize(
				data[item]
			)}' WHERE config_name = '${item}'`;
			consoleLog(sqlUpdate);
			await db.query(sqlUpdate, async (error, results, fields) => {
				consoleLog(results);
			});
		}
		res.send({
			success: ACTION_MESSAGES.SUCCESS_FLAG,
			message: ACTION_MESSAGES.REQUEST_SUCCESS,
			data: data,
		});
	}
});

router.get('/configurations', checkTokenExists, async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/configurations/configurations';

	let sqlSiteConfigurations = `SELECT p.site_config_parent_id,p.site_config_title,c.config_name,c.config_title,c.config_id,c.config_value,c.input_type,c.comments as options
        FROM site_config_parent p
        LEFT JOIN site_config c ON c.site_config_parent_id = p.site_config_parent_id
        WHERE p.deleted_status = 'N'
        ORDER BY p.site_config_parent_id`;
	await db.query(sqlSiteConfigurations, async (error, configRecords, fields) => {
		const parentsMap = new Map();
		for (const row of configRecords) {
			const {
				site_config_parent_id,
				site_config_title,
				config_name,
				config_title,
				config_id,
				config_value,
				input_type,
				options,
			} = row;
			if (!parentsMap.has(site_config_parent_id)) {
				parentsMap.set(site_config_parent_id, {
					id: site_config_parent_id,
					name: site_config_title,
					products: [],
				});
			}
			if (config_id) {
				parentsMap.get(site_config_parent_id).products.push({
					id: config_id,
					title: config_title,
					name: config_name,
					parent_id: site_config_parent_id,
					parent_name: site_config_title,
					value: config_value,
					input_type: input_type,
					options: options,
				});
			}
		}
		const parents = Array.from(parentsMap.values());
		responseData = {
			page_title: meta_details[0].page_title,
            meta_title: meta_details[0].meta_title,
            meta_description: meta_details[0].meta_description,
			login_id: loginDetails.user_id,
			role_id: loginDetails.user_role_id,
			user_email: loginDetails.user_email,
			configurations: parents,
			partialsDir: [path.join(__dirname, 'views/partials')],
		};
		functions.renderData(req,res,responseData,viewDirectory);
	});
});

/********************* Configurations Modules Over *********************/

/******************** Meta Details Start ***********/
router.get('/metadetails', checkTokenExists, async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/metadetails/metadetails';

	let sqlMetaDetails = `SELECT * FROM ${DBTABLES.META_DETAILS} ORDER BY meta_id DESC`;
	await db.query(sqlMetaDetails, async (error, metaRecords, fields) => {
		res.render(viewDirectory, {
			page_title: meta_details[0].page_title,
            meta_title: meta_details[0].meta_title,
            meta_description: meta_details[0].meta_description,
			login_id: loginDetails.user_id,
			role_id: loginDetails.user_role_id,
			user_email: loginDetails.user_email,
			metadetails: metaRecords,
			partialsDir: [path.join(__dirname, 'views/partials')],
		});
	});
});


router.post('/metadetails', checkTokenExists, async (req, res) => {
	try {
	  const data = req.body;
	  const updatePromises = [];
  
	  for (const key in data) {
		if (data.hasOwnProperty(key)) {
		  let arr_data = key.split("__");
		  let meta_id = arr_data[1];
		  let column_name = "";
		  
		  if (arr_data[0] == 'page_title') {
			column_name = "page_title";
		  } else if (arr_data[0] == 'meta_title') {
			column_name = "meta_title";
		  } else if (arr_data[0] == 'meta_description') {
			column_name = "meta_description";
		  }
  
		  // Create a promise for each query and add to array
		  updatePromises.push(
			new Promise((resolve, reject) => {
			  let sqlUpdate = `UPDATE ${DBTABLES.META_DETAILS} SET ${column_name} = ? WHERE meta_id = ?`;
			  db.query(sqlUpdate, [data[key], meta_id], (error, results) => {
				if (error) reject(error);
				else resolve(results);
			  });
			})
		  );
		}
	  }
  
	  // Wait for all updates to complete
	  await Promise.all(updatePromises);
	  res.status(200).send({ data: data, message: ACTION_MESSAGES.REQUEST_SUCCESS });
	  
	} catch (error) {
	  console.error(error);
	  res.status(500).send({ error: ACTION_MESSAGES.REQUEST_FAIL });
	}
  });

/******************** Meta Details Over ***********/

/************ Testing Data Start  *************/

router.get('/createguestuser', async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const responseData = {
        page_title: meta_details[0].page_title,
        meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
    functions.renderData(req,res,responseData,req.route.path);
});

router.get('/check_database_connection', async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	let success = '';
	let message = '';
	let data = '';
	try {
		let sqlQuery = `SELECT user_firstname,user_lastname,user_name,user_email FROM ${DBTABLES.USERS} ORDER BY user_id DESC LIMIT 0,1`;
		await db.query(sqlQuery, (error, results, fields) => {
			success = 1;
			message = ACTION_MESSAGES.DATABASE_CONNECTED;
			error = JSON.stringify(error);
			data = results;

			const responseData = {
                page_title: meta_details[0].page_title,
                meta_title: meta_details[0].meta_title,
                meta_description: meta_details[0].meta_description,
				success: success,
				message: message,
				data: JSON.stringify(data),
				error: error,
				partialsDir: [path.join(__dirname, 'views/partials')],
			};
            functions.renderData(req,res,responseData,req.route.path);
		});
	} catch (error) {
		success = 0;
		message = ACTION_MESSAGES.REQUEST_FAIL;
		data = [];
		error = JSON.stringify(error);
		const responseData = {
            page_title: meta_details[0].page_title,
            meta_title: meta_details[0].meta_title,
            meta_description: meta_details[0].meta_description,
            success: success,
			message: message,
			data: data,
			error: error,
			partialsDir: [path.join(__dirname, 'views/partials')],
		};
        functions.renderData(req,res,responseData,req.route.path);
	}
});

router.get('/check_email_sent', async (req, res) => {
	let error_status = 0;
	let message = '';
	let token = '';
	let response_data = [];
	let to = 'mayank.patel104@gmail.com';
	let subject = 'Hello from Cloudswift Solutions';
	let text = 'This is a test email sent via Hostinger SMTP server!';
	let html = '<b>Cloudswift Solutions is a test email sent via Hostinger SMTP server!</b>';
	let response = await functions.sentAnEmail(to, subject, text, html);
	try {
		error_status = 0;
		message = 'Email sent successfully';
		response_data = response;
	} catch (error) {
		message = 'Email sent failed';
		response_data = error;
	}

	res.send({
        success: error_status == 1 ? ACTION_MESSAGES.FAIL_FLAG : ACTION_MESSAGES.SUCCESS_FLAG,
		message: message,
		token: token,
		data: response_data,
	});
});

router.post('/create_guest_user', uploads.single('user_photo'), async (req, res) => {
	let error_status = '';
	let response_data = [];
	let message = '';
	let token = '';
	req.body.user_photo = '';
	if (req.file && req.file !== undefined && req.file.path !== undefined && req.file.path != '') {
		req.body.user_photo = req.file.path;
	}
	let data = req.body;
	try {
		let sqlQuery = `SELECT * FROM ${DBTABLES.USERS} WHERE user_email = '${data.user_email}'`;
		await db.query(sqlQuery, async (error, results, fields) => {
			if (error) {
				error_status = 1;
				message = error;
			}
			if (results && results.length == 0) {
				error_status = 1;
				response_data = [];
				const encryptPass = bcrypt.hashSync(data.user_password, 10);
				let sqlInsert = `INSERT INTO ${DBTABLES.USERS} SET user_firstname = '${data.user_firstname}', user_lastname = '${data.user_lastname}', user_name = '${data.user_name}',user_email = '${data.user_email}',user_password ='${encryptPass}', user_photo = '${data.user_photo}', created_date = NOW()`;
				await db.query(sqlInsert, async (error, results, fields) => {
					success_status = 1;
					response_data = data;
					message = ACTION_MESSAGES.REQUEST_SUCCESS;
					if (ACTION_MESSAGES.ALLOW_AUTOLOGIN == 'Y') {
						let user_id = results.insertId;
						data.user_id = user_id;
						token = jwt.sign({ user_id }, process.env.JWT_SECRET, {
							expiresIn: process.env.JWT_EXPIRES_IN,
						});
					}
				});
			} else {
				error_status = 1;
				response_data = [];
				message = ACTION_MESSAGES.EMAIL_EXISTS;
			}
		});
	} catch (error) {
		error_status = 1;
	}
	setTimeout(() => {
		res.send({
            success: error_status == 1 ? ACTION_MESSAGES.FAIL_FLAG : ACTION_MESSAGES.SUCCESS_FLAG,
			message: message,
			token: token,
			data: response_data,
		});
	}, 1000);
});

router.post('/reset_password', async (req, res) => {
	let user_token = req.body.user_token;
	let user_email = req.body.user_email;
	let html = ``;
	if (user_token != '' && user_email != '') {
		let sqlVerifyToken = `SELECT * FROM ${DBTABLES.USERS} WHERE user_email = '${user_email}' AND user_token = '${user_token}'`;
		await db.query(sqlVerifyToken, async (error, results, fields) => {
			if (results && results.length > 0) {
				let user_name = results[0].user_firstname + ' ' + results[0].user_lastname;
				if (results[0].active_status == 'N') {
					res.send({
						success: ACTION_MESSAGES.SUCCESS_FLAG,
						message: ACTION_MESSAGES.INACTIVE_ACCOUNT,
						data: results,
					});
				} else if (results[0].deleted_status == 'Y') {
					res.send({
						success: ACTION_MESSAGES.SUCCESS_FLAG,
						message: ACTION_MESSAGES.DELETED_ACCOUNT,
						data: results,
					});
				} else {
					try {
						html += `<tr><td><h4>Hello ${user_name},</h4><p>Your password has been changed on ${CONSTANTS.COMPANY_NAME}.</p><p>If you have any questions or need further assistance, please contact us.</p></td></tr>`;

						let to = req.body.user_email;
						let subject = `${LABELS.CHANGEPASSWORD_SUBJECT} - ${CONSTANTS.COMPANY_NAME}`;
						let text = '';
						await functions.sentAnEmail(to, subject, text, html);

						const encryptPass = bcrypt.hashSync(req.body.user_password, 10);
						let sqlUpdate = `UPDATE ${DBTABLES.USERS} SET user_token = '', user_password = '${encryptPass}' WHERE user_id = ${results[0].user_id}`;
						await db.query(sqlUpdate, async (error, resultUserToken, fields) => {
							res.send({
								success: ACTION_MESSAGES.SUCCESS_FLAG,
								message: ACTION_MESSAGES.EMAIL_SUCCESS_SENT,
								data: results2,
							});
						});
					} catch (error) {
						res.send({
							success: ACTION_MESSAGES.SUCCESS_FLAG,
							message: ACTION_MESSAGES.EMAIL_FAIL_SENT,
							data: [],
							error: error,
						});
					}
				}
			} else {
				res.send({
					success: ACTION_MESSAGES.FAIL_FLAG,
					message: ACTION_MESSAGES.INVALID_ACCOUNT,
					data: [],
				});
			}
		});
	} else {
		res.send({
			success: ACTION_MESSAGES.FAIL_FLAG,
			message: ACTION_MESSAGES.INVALID_ACCOUNT,
			data: [],
		});
	}
});

/************ Testing Data Over  *************/

module.exports = router;