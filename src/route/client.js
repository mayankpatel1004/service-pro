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

router.post('/get_sub_services', async (req, res) => {
	let data = req.body;
	if(data.service_type_id > 0){
		let sqlSubServices = `SELECT meta_id,sub_service_title FROM ${DBTABLES.SERVICE_TYPE_META} WHERE service_type_id = '${data.service_type_id}'`;
		await db.query(sqlSubServices, async (error, results, fields) => {
			res.send({success:1, message: "Success", data:results});	
		});
	} else {
		res.send({success:0, message: "No data found",data:[]});
	}
});

/********************* Services Modules Start *********************/
router.get('/services', checkTokenExists, async (req, res) => {
	let onlyAdmins = 0;
	if(req.query.adm == 1){
		onlyAdmins = 1;
	}
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/clients/services';
	const responseData = {
		page_title: meta_details[0].page_title,
		meta_title: meta_details[0].meta_title,
		onlyAdmins: onlyAdmins,
		meta_description: meta_details[0].meta_description,
		login_id: loginDetails.service_id,
		role_id: loginDetails.user_role_id,
		search_keyword: 'Search By Name/ Email',
		view_path: viewDirectory,
		js_path: functions.getHostUrl(req) + '/templates/views/clients/services/service.js',
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
			"%' OR company_name LIKE '%" +
			req.body.search_keyword +
			"%') ";
	}

	if (req.body.action == 'update_status' && ['Y', 'N', 'T'].includes(req.body.status)) {
		let sqlUpdateStatus = ``;
		if (req.body.status == 'T') {
			sqlUpdateStatus = `UPDATE ${DBTABLES.USERS} SET deleted_status = 'Y' WHERE service_id IN (${req.body.pk_ids})`;
		} else {
			sqlUpdateStatus = `UPDATE ${DBTABLES.USERS} SET active_status = '${req.body.status}' WHERE service_id IN (${req.body.pk_ids})`;
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
			searchKeywordString += ` AND service_id IN (${req.body.pk_ids})`;
		}
		let sqlList = `SELECT s.service_id,u.user_firstname,u.user_lastname,u.user_email,u.company_name,IF(u.active_status = 'Y', 'Yes', 'No') AS active_status,IF(u.deleted_status = 'Y', 'Yes', 'No') AS deleted_status,s.display_status,DATE_FORMAT(s.created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(s.updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
		FROM ${DBTABLES.USERS} u
        LEFT JOIN ${DBTABLES.SERVICE} s ON s.user_id = u.user_id
		WHERE 1=1 ${searchKeywordString} 
		AND u.deleted_status = 'N' 
		${orderByString}
		${limitString}`;
		await db.query(sqlList, async (error, results, fields) => {
			let sqlTotalRecords = `SELECT s.service_id,u.user_firstname,u.user_lastname,u.user_email,u.company_name,IF(u.active_status = 'Y', 'Yes', 'No') AS active_status,IF(u.deleted_status = 'Y', 'Yes', 'No') AS deleted_status,s.display_status,DATE_FORMAT(s.created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(s.updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
            FROM ${DBTABLES.USERS} u
            LEFT JOIN ${DBTABLES.SERVICE} s ON s.user_id = u.user_id
            WHERE 1=1 ${searchKeywordString} 
            AND s.deleted_status = 'N' 
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

router.get('/service_form', checkTokenExists, async (req, res) => {
	const arrFields = [];
	let arrMeta = [];
	const timePart = Date.now() % 10000;
    const randomPart = Math.floor(Math.random() * 100);

    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let edit_id = 0;
	let edit_user_id = 0;
    let edit_service_type = 0;
	let readonly = '';
    let edit_user_firstname = "";
    let edit_company_name = "";
    let edit_service_type_title = "";

	if (req.query.edit_id && req.query.edit_id > 0) {
		edit_id = req.query.edit_id;
		let sqlService = `SELECT s.service_id,s.user_id,s.service_type,u.user_firstname,u.company_name,st.service_type_title 
        FROM ${DBTABLES.SERVICE} s 
        LEFT JOIN ${DBTABLES.USERS} u ON u.user_id = s.user_id
        LEFT JOIN ${DBTABLES.SERVICE_TYPE} st on st.service_type_id = u.service_type
        WHERE s.service_id = '${edit_id}'`;
		let sqlServiceTypeMeta = `SELECT * FROM ${DBTABLES.SERVICE_META} WHERE service_id = '${edit_id}'`;
		await db.query(sqlService, async (error, results, fields) => {
			await db.query(sqlServiceTypeMeta, async (error, resultsMeta, fields) => {
				arrMeta = resultsMeta;
				if (results && results.length > 0) {
					edit_id = results[0].service_id;
					edit_user_id = results[0].user_id;
					edit_service_type = results[0].service_type;
					edit_user_firstname = results[0].user_firstname;
					edit_company_name = results[0].company_name;
					edit_service_type_title = results[0].service_type_title;
					readonly = 'readonly';
				}
			});
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
			lbl: 'Client Name',
			nm: 'user_firstname',
			val: edit_user_firstname,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Client Company Name',
			nm: 'company_name',
			val: edit_company_name,
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
		let viewDirectory = path.join(__dirname, '../') + 'templates/views/clients/service_form';
		const responseData = {
            page_title: meta_details[0].page_title,
            meta_title: meta_details[0].meta_title,
            meta_description: meta_details[0].meta_description,
			login_id: loginDetails.service_id,
			role_id: loginDetails.user_role_id,
			fields: arrFields,
			meta_data: arrMeta,
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
	const metaKeys = Object.keys(data).filter(key => key.startsWith('meta_'));
	let sqlSave = '';

	let file_upload_string = '';
	if (typeof req.files.user_photo !== 'undefined' && req.files.user_photo.length > 0) {
		data.user_photo = req.files.user_photo[0].filename;
		file_upload_string += `, user_photo = '${data.user_photo}'`;
	}

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
		sqlSave = `UPDATE ${DBTABLES.SERVICE} SET ${save_string} WHERE service_id = '${data.edit_id}'`;
	} else {
		sqlSave = `INSERT INTO ${DBTABLES.SERVICE} SET ${save_string}`;
	}
	await db.query(sqlSave, async (error, results, fields) => {

		let saved_id = 0;
		if(data.edit_id > 0){
			saved_id = data.edit_id;
		} else {
			saved_id = results.insertId;
		}
		if(metaKeys && metaKeys.length > 0){
			let sqlDeleteData = `DELETE FROM ${DBTABLES.SERVICE_META} WHERE service_id = ${saved_id}`;
			await db.query(sqlDeleteData, async (error, resultsDelete, fields) => {
				for (const [key,item] of Object.entries(metaKeys)){
					if(item != ""){
						if(data[item] == 1){
							let split_data = item.split("meta_");
							let sub_service_id = split_data[1];
							let sqlInsert = `INSERT INTO ${DBTABLES.SERVICE_META} SET service_id = ${saved_id}, sub_service_id = '${sub_service_id}'`; 
							await db.query(sqlInsert, async (error, results, fields) => {
								//console.log("InsertedID =>",results.insertId);
							});
						}
					}
				}
			});
		}
		
		res.send({
			success: ACTION_MESSAGES.SUCCESS_FLAG,
			message: ACTION_MESSAGES.REQUEST_SUCCESS,
			data: results,
		});
	});
});

/********************* Services Modules Over *********************/

/********************* Schedule Modules Start *********************/
router.get('/schedule', checkTokenExists, async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/clients/schedule';
	const responseData = {
		page_title: meta_details[0].page_title,
		meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		login_id: loginDetails.user_id,
		role_id: loginDetails.user_role_id,
		search_keyword: 'Search By Name/ Email',
		view_path: viewDirectory,
		js_path: functions.getHostUrl(req) + '/templates/views/clients/schedule/schedule.js',
		listUrl: functions.getHostUrl(req) + '/clients/schedule',
		formUrl: functions.getHostUrl(req) + '/clients/schedule_form',
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
	functions.renderData(req,res,responseData,viewDirectory);
});

router.post('/schedule', checkTokenExists,async (req, res) => {
	let searchKeywordString = '';
	let orderByString = 'ORDER BY schedule_id DESC';
	let page_no = 1;
	if (req && req.body.page_no !== undefined && req.body.page_no != '/') {
		page_no = req.body.page_no;
	}
	let rpp = CONFIG.RECORDS_PER_PAGE;
	let start = (parseInt(page_no) - 1) * parseInt(rpp);
	let limitString = ' LIMIT  ' + start + ',' + rpp;

	if (req.body && req.body.search_keyword !== undefined && req.body.search_keyword != '') {
		searchKeywordString +=
			" AND ( customer_name LIKE '%" +
			req.body.search_keyword +
			"%' OR customer_contact LIKE '%" +
            req.body.search_keyword +
			"%' OR service_description LIKE '%" +
            req.body.search_keyword +
			"%') ";
	}

	if (req.body.action == 'update_status' && ['Y', 'N', 'T'].includes(req.body.status)) {
		let sqlUpdateStatus = ``;
		if (req.body.status == 'T') {
			sqlUpdateStatus = `UPDATE ${DBTABLES.SCHEDULE} SET deleted_status = 'Y' WHERE schedule_id IN (${req.body.pk_ids})`;
		} else {
			sqlUpdateStatus = `UPDATE ${DBTABLES.SCHEDULE} SET display_status = '${req.body.status}' WHERE schedule_id IN (${req.body.pk_ids})`;
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
			searchKeywordString += ` AND schedule_id IN (${req.body.pk_ids})`;
		}
		let sqlList = `SELECT schedule_id,service_id,customer_name,customer_contact,service_description,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
		FROM ${DBTABLES.SCHEDULE} 
		WHERE 1=1 ${searchKeywordString} 
		AND deleted_status = 'N' 
		${orderByString}
		${limitString}`;
		await db.query(sqlList, async (error, results, fields) => {
			let sqlTotalRecords = `SELECT schedule_id,service_id,customer_name,customer_contact,service_description,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at  
			FROM ${DBTABLES.SCHEDULE} 
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
								{ id: 'customer_name', title: 'Customer Name' },
								{ id: 'customer_contact', title: 'Customer Contact' },
								{ id: 'service_description', title: 'Service Description' },
								{ id: 'created_at', title: 'Created' }
							]
						});
						let obj1 = {customer_name: "",service_id: ""}
						let obj2 = {customer_name: "Total Records",service_id: total_records}
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

router.get('/schedule_form', checkTokenExists, async (req, res) => {
	const arrFields = [];
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
    
    const timePart = Date.now() % 10000;
    const randomPart = Math.floor(Math.random() * 100);

	let edit_id = 0;
	let edit_service_id = "";
    let edit_customer_name = "";
    let edit_customer_contact = "";
	let edit_service_description = "";
    let edit_display_status = "";
    let readonly = '';

	if (req.query.edit_id && req.query.edit_id > 0) {
		edit_id = req.query.edit_id;
		let sqlUser = `SELECT * FROM ${DBTABLES.SCHEDULE} WHERE schedule_id = '${edit_id}'`;
		await db.query(sqlUser, async (error, results, fields) => {
            if (results && results.length > 0) {
				edit_id = results[0].schedule_id;
				edit_service_id = results[0].service_id;
				edit_customer_name = results[0].customer_name;
				edit_customer_contact = results[0].customer_contact;
				edit_service_description = results[0].service_description;
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
			type: 'select',
			lbl: 'Select Service',
			nm: 'service_id',
			val: edit_service_id,
			ph: '',
			req: 'N',
			options: functions.serviceType(),
			cls: 'form-control js-example-basic-single formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Customer Name',
			nm: 'customer_name',
			val: edit_customer_name,
			ph: '',
			req: 'Y',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Customer Contact',
			nm: 'customer_contact',
			val: edit_customer_contact,
			ph: '',
			req: 'Y',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Service Details',
			nm: 'service_description',
			val: edit_service_description,
			ph: '',
			req: 'Y',
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
		let viewDirectory = path.join(__dirname, '../') + 'templates/views/clients/schedule_form';
		const responseData = {
            page_title: meta_details[0].page_title,
            meta_title: meta_details[0].meta_title,
            meta_description: meta_details[0].meta_description,
			login_id: loginDetails.schedule_id,
			role_id: loginDetails.user_role_id,
			fields: arrFields,
			view_path: viewDirectory,
			listUrl: functions.getHostUrl(req) + '/clients/schedule',
			formUrl: functions.getHostUrl(req) + '/clients/schedule_form',
			partialsDir: [path.join(__dirname, 'views/partials')],
		};
        functions.renderData(req,res,responseData,viewDirectory);
	}, 1000);
});

router.post('/schedule_form', userImageUpload, async (req, res) => {
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
		sqlSave = `UPDATE ${DBTABLES.SCHEDULE} SET ${save_string} WHERE schedule_id = '${data.edit_id}'`;
	} else {
		sqlSave = `INSERT INTO ${DBTABLES.SCHEDULE} SET ${save_string}`;
	}
	await db.query(sqlSave, async (error, results, fields) => {
		res.send({
			success: ACTION_MESSAGES.SUCCESS_FLAG,
			message: ACTION_MESSAGES.REQUEST_SUCCESS,
			data: results,
		});
	});
});
/********************* Schedule Modules Over *********************/


/********************* Services Type Modules Start *********************/
router.get('/service_type', checkTokenExists, async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/clients/service_type';
	const responseData = {
		page_title: meta_details[0].page_title,
		meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		login_id: loginDetails.user_id,
		role_id: loginDetails.user_role_id,
		search_keyword: 'Search By Name/ Email',
		view_path: viewDirectory,
		js_path: functions.getHostUrl(req) + '/templates/views/clients/services/service_type.js',
		listUrl: functions.getHostUrl(req) + '/clients/service_type',
		formUrl: functions.getHostUrl(req) + '/clients/service_type_form',
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
	functions.renderData(req,res,responseData,viewDirectory);
});

router.post('/service_type', checkTokenExists,async (req, res) => {
	let searchKeywordString = '';
	let orderByString = 'ORDER BY service_type_id DESC';
	let page_no = 1;
	if (req && req.body.page_no !== undefined && req.body.page_no != '/') {
		page_no = req.body.page_no;
	}
	let rpp = CONFIG.RECORDS_PER_PAGE;
	let start = (parseInt(page_no) - 1) * parseInt(rpp);
	let limitString = ' LIMIT  ' + start + ',' + rpp;

	if (req.body && req.body.search_keyword !== undefined && req.body.search_keyword != '') {
		searchKeywordString +=
			" AND ( service_type_id LIKE '%" +
			req.body.search_keyword +
			"%' OR service_type_title LIKE '%" +
            req.body.search_keyword + "%') ";
	}

	if (req.body.action == 'update_status' && ['Y', 'N', 'T'].includes(req.body.status)) {
		let sqlUpdateStatus = ``;
		if (req.body.status == 'T') {
			sqlUpdateStatus = `UPDATE ${DBTABLES.SERVICE_TYPE} SET deleted_status = 'Y' WHERE service_type_id IN (${req.body.pk_ids})`;
		} else {
			sqlUpdateStatus = `UPDATE ${DBTABLES.SERVICE_TYPE} SET display_status = '${req.body.status}' WHERE service_type_id IN (${req.body.pk_ids})`;
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
			searchKeywordString += ` AND service_type_id IN (${req.body.pk_ids})`;
		}
		let sqlList = `SELECT service_type_id,service_type_title,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
		FROM ${DBTABLES.SERVICE_TYPE} 
		WHERE 1=1 ${searchKeywordString} 
		AND deleted_status = 'N' 
		${orderByString}
		${limitString}`;
		await db.query(sqlList, async (error, results, fields) => {
			let sqlTotalRecords = `SELECT service_type_id,service_type_title,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
			FROM ${DBTABLES.SERVICE_TYPE} 
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
								{ id: 'service_type_title', title: 'Industry Type' },
								{ id: 'display_status', title: 'Display Status' },
								{ id: 'created_at', title: 'Created' }
							]
						});
						let obj1 = {service_type_title: "",service_type_id: ""}
						let obj2 = {service_type_title: "Total Records",service_type_id: total_records}
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

router.get('/service_type_form', checkTokenExists, async (req, res) => {
	const arrFields = [];
	let arrMeta = [];
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
    
    const timePart = Date.now() % 10000;
    const randomPart = Math.floor(Math.random() * 100);

	let edit_id = 0;
	let edit_service_type_id = "";
    let edit_service_type_title = "";
    let edit_display_status = "";
    let readonly = '';

	if (req.query.edit_id && req.query.edit_id > 0) {
		edit_id = req.query.edit_id;
		let sqlServiceType = `SELECT * FROM ${DBTABLES.SERVICE_TYPE} WHERE service_type_id = '${edit_id}'`;
		let sqlServiceTypeMeta = `SELECT * FROM ${DBTABLES.SERVICE_TYPE_META} WHERE service_type_id = '${edit_id}'`;
		await db.query(sqlServiceType, async (error, results, fields) => {
			await db.query(sqlServiceTypeMeta, async (error, resultsMeta, fields) => {
				arrMeta = resultsMeta;
				if (results && results.length > 0) {
					edit_id = results[0].service_type_id;
					edit_service_type_id = results[0].service_type_id;
					edit_service_type_title = results[0].service_type_title;
					edit_display_status = results[0].display_status;
					readonly = 'readonly';
				}
			})
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
			lbl: 'Industry Type',
			nm: 'service_type_title',
			val: edit_service_type_title,
			ph: '',
			req: 'Y',
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
		let viewDirectory = path.join(__dirname, '../') + 'templates/views/clients/service_type_form';
		const responseData = {
            page_title: meta_details[0].page_title,
            meta_title: meta_details[0].meta_title,
            meta_description: meta_details[0].meta_description,
			login_id: loginDetails.service_id,
			role_id: loginDetails.user_role_id,
			fields: arrFields,
			meta_data: arrMeta,
			view_path: viewDirectory,
			listUrl: functions.getHostUrl(req) + '/clients/service_type',
			formUrl: functions.getHostUrl(req) + '/clients/service_type_form',
			partialsDir: [path.join(__dirname, 'views/partials')],
		};
        functions.renderData(req,res,responseData,viewDirectory);
	}, 1000);
});

router.post('/service_type_form', userImageUpload, async (req, res) => {
	let data = req.body;
	let all_subservices = data.sub_service;
	let sqlSave = '';
    const setClauses = [];
	let save_string = [];
	if(data){
		for (const [key, value] of Object.entries(data)) {
			if (key === 'edit_id' || key === 'sub_service') continue;
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
		sqlSave = `UPDATE ${DBTABLES.SERVICE_TYPE} SET ${save_string} WHERE service_type_id = '${data.edit_id}'`;
	} else {
		sqlSave = `INSERT INTO ${DBTABLES.SERVICE_TYPE} SET ${save_string}`;
	}
	await db.query(sqlSave, async (error, results, fields) => {
		let saved_id = 0;
		if(data.edit_id > 0){
			saved_id = data.edit_id;
		} else {
			saved_id = results.insertId;
		}
		if(data.sub_service.length > 0){
			let sqlDeleteExistingRows = `DELETE FROM ${DBTABLES.SERVICE_TYPE_META} WHERE service_type_id = '${saved_id}'`;
			await db.query(sqlDeleteExistingRows, async (error, resultsDelete, fields) => {
				let sub_services = data.sub_service;
				for (const [key, value] of Object.entries(sub_services)) {
					if(value != ""){
						let sqlInsert = `INSERT INTO ${DBTABLES.SERVICE_TYPE_META} SET service_type_id = '${saved_id}', sub_service_title = '${value}'`;
						await db.query(sqlInsert, async (error, resultss, fields) => {
							console.log(resultss.insertId);
						});
					}
				}
			});
		}
		res.send({
			success: ACTION_MESSAGES.SUCCESS_FLAG,
			message: ACTION_MESSAGES.REQUEST_SUCCESS,
			data: results,
		});
	});
});

/********************* Services Type Modules Over *********************/

module.exports = router;