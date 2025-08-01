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

/********************* Clients Modules Start *********************/
router.get('/clients', checkTokenExists, async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/clients/clients';
	const responseData = {
		page_title: meta_details[0].page_title,
		meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		login_id: loginDetails.user_id,
		role_id: loginDetails.user_role_id,
		search_keyword: 'Search By Name/ Email',
		view_path: viewDirectory,
		js_path: functions.getHostUrl(req) + '/templates/views/clients/clients/clients.js',
		listUrl: functions.getHostUrl(req) + '/clients/clients',
		formUrl: functions.getHostUrl(req) + '/clients/client_form',
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
	functions.renderData(req,res,responseData,viewDirectory);
});

router.post('/clients', checkTokenExists,async (req, res) => {
	let searchKeywordString = '';
	let orderByString = 'ORDER BY client_id DESC';
	let page_no = 1;
	if (req && req.body.page_no !== undefined && req.body.page_no != '/') {
		page_no = req.body.page_no;
	}
	let rpp = CONFIG.RECORDS_PER_PAGE;
	let start = (parseInt(page_no) - 1) * parseInt(rpp);
	let limitString = ' LIMIT  ' + start + ',' + rpp;

	if (req.body && req.body.search_keyword !== undefined && req.body.search_keyword != '') {
		searchKeywordString +=
			" AND ( company_name LIKE '%" +
			req.body.search_keyword +
			"%' OR client_code LIKE '%" +
            req.body.search_keyword +
			"%' OR client_name LIKE '%" +
            req.body.search_keyword +
			"%' OR email LIKE '%" +
			req.body.search_keyword +
			"%') ";
	}

	if (req.body.action == 'update_status' && ['Y', 'N', 'T'].includes(req.body.status)) {
		let sqlUpdateStatus = ``;
		if (req.body.status == 'T') {
			sqlUpdateStatus = `UPDATE ${DBTABLES.CLIENTS} SET deleted_status = 'Y' WHERE client_id IN (${req.body.pk_ids})`;
		} else {
			sqlUpdateStatus = `UPDATE ${DBTABLES.CLIENTS} SET display_status = '${req.body.status}' WHERE client_id IN (${req.body.pk_ids})`;
		}
        console.log(sqlUpdateStatus);
		await db.query(sqlUpdateStatus, async (error, results, fields) => {
			res.send({
				success: ACTION_MESSAGES.SUCCESS_FLAG,
				message: ACTION_MESSAGES.REQUEST_SUCCESS,
				data: results,
			});
		});
	} else {
		if(req.body.pk_ids){
			searchKeywordString += ` AND client_id IN (${req.body.pk_ids})`;
		}
		let sqlList = `SELECT client_id,company_name,email,client_name,client_code,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
		FROM ${DBTABLES.CLIENTS} 
		WHERE 1=1 ${searchKeywordString} 
		AND deleted_status = 'N' 
		${orderByString}
		${limitString}`;
		await db.query(sqlList, async (error, results, fields) => {
			let sqlTotalRecords = `SELECT client_id,company_name,email,client_name,client_code,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at
			FROM ${DBTABLES.CLIENTS} 
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
								{ id: 'company_name', title: 'Company Name' },
								{ id: 'client_name', title: 'Client Name' },
								{ id: 'client_code', title: 'Client Code' },
                                { id: 'type_of_program', title: 'Type Of Program' },
                                { id: 'sub_services', title: 'Sub Service' },
                                { id: 'contact_1', title: 'Contact 1' },
                                { id: 'contact_2', title: 'Contact 2' },
                                { id: 'email', title: 'Email' },
                                { id: 'gst_no', title: 'GST No.' },
                                { id: 'tan', title: 'TAN' },
                                { id: 'pan', title: 'PAN' },
                                { id: 'type_of_user', title: 'Type Of User' },
                            	{ id: 'display_status', title: 'Display Status' },
								{ id: 'created_at', title: 'Created' }
							]
						});
						let obj1 = {client_name: "",client_code: ""}
						let obj2 = {user_firclient_namestname: "Total Records",client_code: total_records}
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

router.get('/client_form', checkTokenExists, async (req, res) => {
	const arrFields = [];
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
    
    const timePart = Date.now() % 10000;
    const randomPart = Math.floor(Math.random() * 100);

	let edit_id = 0;
	let edit_company_name = "";
    let edit_client_name = "";
    let edit_client_code = parseInt(`${timePart}${randomPart}`.slice(-6), 10);
    let edit_type_of_program = "";
    let edit_sub_services = "";
    let edit_contact_1 = "";
    let edit_contact_2 = "";
    let edit_email = "";
    let edit_gst_no = "";
    let edit_tan = "";
    let edit_pan = "";
    let edit_type_of_user = "";
    let edit_display_status = "";
    let edit_role_id = "";
    let readonly = '';

	if (req.query.edit_id && req.query.edit_id > 0) {
		edit_id = req.query.edit_id;
		let sqlUser = `SELECT * FROM ${DBTABLES.CLIENTS} WHERE client_id = '${edit_id}'`;
		await db.query(sqlUser, async (error, results, fields) => {
            console.log(results);
			if (results && results.length > 0) {
				edit_id = results[0].client_id;
				edit_company_name = results[0].company_name;
				edit_client_name = results[0].client_name;
				edit_client_code = results[0].client_code;
				edit_type_of_program = results[0].type_of_program;
				edit_sub_services = results[0].sub_services;
				edit_contact_1 = results[0].contact_1;
                edit_contact_2 = results[0].contact_2;
                edit_email = results[0].email;
                edit_gst_no = results[0].gst_no;
                edit_tan = results[0].tan;
                edit_pan = results[0].pan;
                edit_type_of_user = results[0].type_of_user;
                edit_display_order = results[0].display_order;
                edit_display_status = results[0].display_status;
                edit_role_id = results[0].edit_role_id;
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
			lbl: 'Company Name',
			nm: 'company_name',
			val: edit_company_name,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Client Name',
			nm: 'client_name',
			val: edit_client_name,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'hidden',
			lbl: 'Client Code',
			nm: 'client_code',
			val: edit_client_code,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
        arrFields.push({
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
		});
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
			type: 'email',
			lbl: 'Email',
			nm: 'email',
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
			lbl: 'Display Status',
			nm: 'display_status',
			val: edit_display_status,
			ph: '',
			req: 'N',
			options: functions.displayStatus(),
			cls: 'form-control js-example-basic-single formfields',
		});
		arrFields.push({
			type: 'select',
			lbl: 'Type Of User',
			nm: 'type_of_user',
			val: edit_type_of_user,
			ph: '',
			req: 'N',
			options: await functions.getAllRoles(),
			cls: 'form-control js-example-basic-single formfields',
		});

		let viewDirectory = path.join(__dirname, '../') + 'templates/views/clients/client_form';
		const responseData = {
            page_title: meta_details[0].page_title,
            meta_title: meta_details[0].meta_title,
            meta_description: meta_details[0].meta_description,
			login_id: loginDetails.client_id,
			role_id: loginDetails.user_role_id,
			fields: arrFields,
			view_path: viewDirectory,
			listUrl: functions.getHostUrl(req) + '/clients/clients',
			formUrl: functions.getHostUrl(req) + '/clients/client_form',
			partialsDir: [path.join(__dirname, 'views/partials')],
		};
        functions.renderData(req,res,responseData,viewDirectory);
	}, 1000);
});

router.post('/client_form', userImageUpload, async (req, res) => {
	let data = req.body;
	let sqlSave = '';
    console.log(req.body);
    console.log(req.params);
    console.log(req.query);
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
		sqlSave = `UPDATE ${DBTABLES.CLIENTS} SET ${save_string} WHERE client_id = '${data.edit_id}'`;
	} else {
		sqlSave = `INSERT INTO ${DBTABLES.CLIENTS} SET ${save_string}`;
	}
	console.log("sqlSave",sqlSave);
	await db.query(sqlSave, async (error, results, fields) => {
		res.send({
			success: ACTION_MESSAGES.SUCCESS_FLAG,
			message: ACTION_MESSAGES.REQUEST_SUCCESS,
			data: results,
		});
	});
});

/********************* Clients Modules Over *********************/


/********************* Services Modules Start *********************/
router.get('/services', checkTokenExists, async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/clients/services';
	const responseData = {
		page_title: meta_details[0].page_title,
		meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		login_id: loginDetails.user_id,
		role_id: loginDetails.user_role_id,
		search_keyword: 'Search By Name/ Email',
		view_path: viewDirectory,
		js_path: functions.getHostUrl(req) + '/templates/views/clients/services/services.js',
		listUrl: functions.getHostUrl(req) + '/clients/services',
		formUrl: functions.getHostUrl(req) + '/clients/service_form',
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
	functions.renderData(req,res,responseData,viewDirectory);
});

router.post('/services', checkTokenExists,async (req, res) => {
	let searchKeywordString = '';
	let orderByString = 'ORDER BY service_id DESC';
	let page_no = 1;
	if (req && req.body.page_no !== undefined && req.body.page_no != '/') {
		page_no = req.body.page_no;
	}
	let rpp = CONFIG.RECORDS_PER_PAGE;
	let start = (parseInt(page_no) - 1) * parseInt(rpp);
	let limitString = ' LIMIT  ' + start + ',' + rpp;

	if (req.body && req.body.search_keyword !== undefined && req.body.search_keyword != '') {
		searchKeywordString +=
			" AND ( service_name LIKE '%" +
			req.body.search_keyword +
			"%' OR service_type LIKE '%" +
            req.body.search_keyword +
			"%' OR input_type LIKE '%" +
            req.body.search_keyword +
			"%') ";
	}

	if (req.body.action == 'update_status' && ['Y', 'N', 'T'].includes(req.body.status)) {
		let sqlUpdateStatus = ``;
		if (req.body.status == 'T') {
			sqlUpdateStatus = `UPDATE ${DBTABLES.SERVICE_PROGRAM} SET deleted_status = 'Y' WHERE service_id IN (${req.body.pk_ids})`;
		} else {
			sqlUpdateStatus = `UPDATE ${DBTABLES.SERVICE_PROGRAM} SET display_status = '${req.body.status}' WHERE service_id IN (${req.body.pk_ids})`;
		}
        console.log(sqlUpdateStatus);
		await db.query(sqlUpdateStatus, async (error, results, fields) => {
			res.send({
				success: ACTION_MESSAGES.SUCCESS_FLAG,
				message: ACTION_MESSAGES.REQUEST_SUCCESS,
				data: results,
			});
		});
	} else {
		if(req.body.pk_ids){
			searchKeywordString += ` AND service_id IN (${req.body.pk_ids})`;
		}
		let sqlList = `SELECT service_id,service_name,service_type,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
		FROM ${DBTABLES.SERVICE_PROGRAM} 
		WHERE 1=1 ${searchKeywordString} 
		AND deleted_status = 'N' 
		${orderByString}
		${limitString}`;
		await db.query(sqlList, async (error, results, fields) => {
			let sqlTotalRecords = `SELECT service_id,service_name,service_type,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
			FROM ${DBTABLES.SERVICE_PROGRAM} 
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
								{ id: 'service_name', title: 'Program Name' },
								{ id: 'service_type', title: 'Program Type' },
								{ id: 'display_status', title: 'Display Status' },
								{ id: 'created_at', title: 'Created' }
							]
						});
						let obj1 = {service_name: "",service_type: ""}
						let obj2 = {service_name: "Total Records",service_type: total_records}
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

router.get('/service_form', checkTokenExists, async (req, res) => {
	const arrFields = [];
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
    
    const timePart = Date.now() % 10000;
    const randomPart = Math.floor(Math.random() * 100);

	let edit_id = 0;
	let edit_service_id = "";
    let edit_service_name = "";
    let edit_service_type = "";
    let edit_display_status = "";
    let readonly = '';

	if (req.query.edit_id && req.query.edit_id > 0) {
		edit_id = req.query.edit_id;
		let sqlUser = `SELECT * FROM ${DBTABLES.SERVICE_PROGRAM} WHERE service_id = '${edit_id}'`;
		await db.query(sqlUser, async (error, results, fields) => {
            console.log(results);
			if (results && results.length > 0) {
				edit_id = results[0].service_id;
				edit_service_id = results[0].service_id;
				edit_service_name = results[0].service_name;
				edit_service_type = results[0].service_type;
				edit_display_status = results[0].display_status;
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
			lbl: 'Service Name',
			nm: 'service_name',
			val: edit_service_name,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
        arrFields.push({
			type: 'select',
			lbl: 'Service Type',
			nm: 'service_type',
			val: edit_service_type,
			ph: '',
			req: 'N',
			options: functions.serviceType(),
			cls: 'form-control js-example-basic-single formfields',
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
		let viewDirectory = path.join(__dirname, '../') + 'templates/views/clients/service_form';
		const responseData = {
            page_title: meta_details[0].page_title,
            meta_title: meta_details[0].meta_title,
            meta_description: meta_details[0].meta_description,
			login_id: loginDetails.service_id,
			role_id: loginDetails.user_role_id,
			fields: arrFields,
			view_path: viewDirectory,
			listUrl: functions.getHostUrl(req) + '/clients/services',
			formUrl: functions.getHostUrl(req) + '/clients/service_form',
			partialsDir: [path.join(__dirname, 'views/partials')],
		};
        functions.renderData(req,res,responseData,viewDirectory);
	}, 1000);
});

router.post('/service_form', userImageUpload, async (req, res) => {
	let data = req.body;
	let sqlSave = '';
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
		sqlSave = `UPDATE ${DBTABLES.SERVICE_PROGRAM} SET ${save_string} WHERE service_id = '${data.edit_id}'`;
	} else {
		sqlSave = `INSERT INTO ${DBTABLES.SERVICE_PROGRAM} SET ${save_string}`;
	}
	console.log("sqlSave",sqlSave);
	await db.query(sqlSave, async (error, results, fields) => {
		res.send({
			success: ACTION_MESSAGES.SUCCESS_FLAG,
			message: ACTION_MESSAGES.REQUEST_SUCCESS,
			data: results,
		});
	});
});

/********************* Services Modules Over *********************/

module.exports = router;